import express from 'express';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { toProject, PROJECT_SELECT } from './db.js';
import { checkCredentials, issueToken, requireAdmin, adminConfigured } from './auth.js';
import {
  validateEnquiry, validateProject, validateCategory, hasErrors, PROJECT_TYPES, BUDGET_RANGES
} from './validation.js';
import { IMAGE_LIBRARY } from './seed-data.js';

/**
 * Build the Express application.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ staticDir?: string, imagesDir?: string }} options
 */
export function createApp(db, { staticDir, imagesDir } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const api = express.Router();

  // ---------- Public endpoints ----------
  api.get('/health', (req, res) => res.json({ status: 'ok' }));

  api.get('/meta', (req, res) => res.json({ projectTypes: PROJECT_TYPES, budgetRanges: BUDGET_RANGES }));

  api.get('/categories', (req, res) => {
    const rows = db.prepare(`
      SELECT c.*, COUNT(p.id) AS project_count
      FROM categories c LEFT JOIN projects p ON p.category_id = c.id AND p.published = 1
      GROUP BY c.id ORDER BY c.sort_order, c.name`).all();
    res.json(rows);
  });

  api.get('/projects', (req, res) => {
    const where = ['p.published = 1'];
    const params = [];
    if (req.query.category) { where.push('c.slug = ?'); params.push(String(req.query.category)); }
    if (req.query.featured === 'true') where.push('p.featured = 1');
    if (req.query.q) {
      where.push('(p.title LIKE ? OR p.summary LIKE ? OR p.location LIKE ? OR p.style LIKE ?)');
      const like = `%${String(req.query.q).slice(0, 60)}%`;
      params.push(like, like, like, like);
    }
    const sort = req.query.sort === 'oldest' ? 'p.year ASC, p.id ASC' : 'p.year DESC, p.id DESC';
    const rows = db.prepare(`${PROJECT_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${sort}`).all(...params);
    res.json(rows.map(toProject));
  });

  api.get('/projects/:slug', (req, res) => {
    const row = db.prepare(`${PROJECT_SELECT} WHERE p.slug = ? AND p.published = 1`).get(req.params.slug);
    if (!row) return res.status(404).json({ error: 'Project not found' });
    const project = toProject(row);
    const related = db.prepare(`${PROJECT_SELECT} WHERE p.category_id = ? AND p.id != ? AND p.published = 1 ORDER BY p.year DESC LIMIT 3`)
      .all(row.category_id, row.id).map(toProject);
    res.json({ ...project, related });
  });

  // Very small in-memory rate limit for the public form (per IP, 5 per 10 minutes).
  const hits = new Map();
  const RATE_WINDOW_MS = 10 * 60 * 1000;
  const RATE_MAX = Number(process.env.ENQUIRY_RATE_LIMIT || 5);
  function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip;
    const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX) return res.status(429).json({ error: 'Too many enquiries. Please try again later.' });
    recent.push(now);
    hits.set(key, recent);
    next();
  }

  api.post('/enquiries', rateLimit, (req, res) => {
    // Honeypot field: real users never fill it in.
    if (req.body && req.body.website) return res.status(201).json({ ok: true });
    const { value, errors } = validateEnquiry(req.body);
    if (hasErrors(errors)) return res.status(422).json({ error: 'Validation failed', fields: errors });
    const info = db.prepare(`INSERT INTO enquiries (name, email, phone, project_type, budget_range, message, project_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(value.name, value.email, value.phone, value.project_type, value.budget_range, value.message, value.project_slug);
    res.status(201).json({ ok: true, id: Number(info.lastInsertRowid) });
  });

  // ---------- Admin endpoints ----------
  api.post('/admin/login', (req, res) => {
    if (!adminConfigured()) return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in backend/.env.' });
    const { username, password } = req.body || {};
    if (!checkCredentials(username, password)) return res.status(401).json({ error: 'Invalid username or password' });
    res.json({ token: issueToken(username), username });
  });

  const admin = express.Router();
  admin.use(requireAdmin);

  admin.get('/stats', (req, res) => {
    const one = (sql) => db.prepare(sql).get().n;
    res.json({
      projects: one('SELECT COUNT(*) AS n FROM projects'),
      published: one('SELECT COUNT(*) AS n FROM projects WHERE published = 1'),
      categories: one('SELECT COUNT(*) AS n FROM categories'),
      newEnquiries: one("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'"),
      enquiries: one('SELECT COUNT(*) AS n FROM enquiries')
    });
  });

  admin.get('/images', (req, res) => {
    // Photo library (Unsplash CDN) followed by any image files added under frontend/public/images/projects
    const local = imagesDir && existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f)).sort().map((f) => `/images/projects/${f}`)
      : [];
    res.json([...IMAGE_LIBRARY, ...local]);
  });

  // Projects (including unpublished)
  admin.get('/projects', (req, res) => {
    res.json(db.prepare(`${PROJECT_SELECT} ORDER BY p.updated_at DESC, p.id DESC`).all().map(toProject));
  });

  admin.get('/projects/:id', (req, res) => {
    const row = db.prepare(`${PROJECT_SELECT} WHERE p.id = ?`).get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(toProject(row));
  });

  function saveProject(req, res, id) {
    const { value, errors } = validateProject(req.body);
    if (hasErrors(errors)) return res.status(422).json({ error: 'Validation failed', fields: errors });
    if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(value.category_id)) {
      return res.status(422).json({ error: 'Validation failed', fields: { category_id: 'Category does not exist.' } });
    }
    const clash = db.prepare('SELECT id FROM projects WHERE slug = ?').get(value.slug);
    if (clash && clash.id !== id) return res.status(409).json({ error: 'Validation failed', fields: { slug: 'Another project already uses this slug.' } });

    const cols = [value.slug, value.title, value.category_id, value.location, value.area_sqft, value.year, value.style,
      value.summary, value.description, JSON.stringify(value.highlights), JSON.stringify(value.materials),
      value.cover_image, JSON.stringify(value.gallery), value.featured, value.published];
    if (id == null) {
      const info = db.prepare(`INSERT INTO projects (slug, title, category_id, location, area_sqft, year, style, summary,
        description, highlights, materials, cover_image, gallery, featured, published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...cols);
      id = Number(info.lastInsertRowid);
      res.status(201);
    } else {
      const info = db.prepare(`UPDATE projects SET slug=?, title=?, category_id=?, location=?, area_sqft=?, year=?, style=?,
        summary=?, description=?, highlights=?, materials=?, cover_image=?, gallery=?, featured=?, published=?,
        updated_at=datetime('now') WHERE id=?`).run(...cols, id);
      if (info.changes === 0) return res.status(404).json({ error: 'Project not found' });
    }
    res.json(toProject(db.prepare(`${PROJECT_SELECT} WHERE p.id = ?`).get(id)));
  }

  admin.post('/projects', (req, res) => saveProject(req, res, null));
  admin.put('/projects/:id', (req, res) => saveProject(req, res, Number(req.params.id)));
  admin.delete('/projects/:id', (req, res) => {
    const info = db.prepare('DELETE FROM projects WHERE id = ?').run(Number(req.params.id));
    if (info.changes === 0) return res.status(404).json({ error: 'Project not found' });
    res.status(204).end();
  });

  // Categories
  admin.post('/categories', (req, res) => {
    const { value, errors } = validateCategory(req.body);
    if (hasErrors(errors)) return res.status(422).json({ error: 'Validation failed', fields: errors });
    if (db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(value.slug)) return res.status(409).json({ error: 'Validation failed', fields: { slug: 'Slug already in use.' } });
    const info = db.prepare('INSERT INTO categories (slug, name, description, sort_order) VALUES (?,?,?,?)').run(value.slug, value.name, value.description, value.sort_order);
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(info.lastInsertRowid)));
  });

  admin.put('/categories/:id', (req, res) => {
    const id = Number(req.params.id);
    const { value, errors } = validateCategory(req.body);
    if (hasErrors(errors)) return res.status(422).json({ error: 'Validation failed', fields: errors });
    const clash = db.prepare('SELECT id FROM categories WHERE slug = ?').get(value.slug);
    if (clash && clash.id !== id) return res.status(409).json({ error: 'Validation failed', fields: { slug: 'Slug already in use.' } });
    const info = db.prepare('UPDATE categories SET slug=?, name=?, description=?, sort_order=? WHERE id=?').run(value.slug, value.name, value.description, value.sort_order, id);
    if (info.changes === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
  });

  admin.delete('/categories/:id', (req, res) => {
    const id = Number(req.params.id);
    const used = db.prepare('SELECT COUNT(*) AS n FROM projects WHERE category_id = ?').get(id).n;
    if (used > 0) return res.status(409).json({ error: `Category has ${used} project(s). Move or delete them first.` });
    const info = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Category not found' });
    res.status(204).end();
  });

  // Enquiries
  admin.get('/enquiries', (req, res) => {
    const status = req.query.status;
    const rows = status
      ? db.prepare('SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC, id DESC').all(String(status))
      : db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC').all();
    res.json(rows);
  });

  admin.patch('/enquiries/:id', (req, res) => {
    const status = req.body?.status;
    if (!['new', 'contacted', 'closed'].includes(status)) return res.status(422).json({ error: 'Status must be new, contacted or closed.' });
    const info = db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, Number(req.params.id));
    if (info.changes === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(db.prepare('SELECT * FROM enquiries WHERE id = ?').get(Number(req.params.id)));
  });

  admin.delete('/enquiries/:id', (req, res) => {
    const info = db.prepare('DELETE FROM enquiries WHERE id = ?').run(Number(req.params.id));
    if (info.changes === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.status(204).end();
  });

  api.use('/admin', admin);
  api.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api', api);

  // ---------- Built Angular app (production mode) ----------
  if (staticDir && existsSync(join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(resolve(staticDir, 'index.html')));
  }

  // JSON error handler (malformed JSON bodies etc.)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
  });

  return app;
}
