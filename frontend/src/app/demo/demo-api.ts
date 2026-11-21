// Demo build only (see angular.json "demo" configuration): answers /api/* requests in the browser with
// in-memory sample data, so the whole app, admin included, runs on static hosting such as GitHub Pages.
// It mirrors the Express API's responses and validation closely but is not used by the normal build.
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { DEMO_BUDGET_RANGES, DEMO_CATEGORIES, DEMO_IMAGES, DEMO_PROJECTS, DEMO_PROJECT_TYPES } from './demo-data';

// Public demo credentials for the in-browser admin. They unlock nothing beyond this page's memory.
export const DEMO_USER = 'demo';
export const DEMO_PASSWORD = 'preview';
const TYPES = DEMO_PROJECT_TYPES;
const BUDGETS = DEMO_BUDGET_RANGES;
const IMAGES = DEMO_IMAGES;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Any = any;
const db = {
  categories: DEMO_CATEGORIES.map((c) => ({ ...c })) as Any[],
  projects: DEMO_PROJECTS.map((p) => ({ ...p })) as Any[],
  enquiries: [] as Any[],
  seq: { project: 100, category: 100, enquiry: 1 }
};

const ok = (body: unknown, status = 200): Observable<HttpResponse<unknown>> => of(new HttpResponse({ status, body })).pipe(delay(120));
const fail = (status: number, error: Any, url: string) =>
  throwError(() => new HttpErrorResponse({ status, error, url })).pipe(delay(120)) as Observable<never>;
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function withCategory(p: Any) {
  const c = db.categories.find((x) => x.id === p.category_id);
  return { ...p, category: c ? { id: c.id, slug: c.slug, name: c.name } : { id: 0, slug: '', name: '' } };
}

function validateProject(b: Any): Any {
  const f: Any = {};
  if (!SLUG.test(b.slug ?? '')) f['slug'] = 'Slug must be lowercase words joined by hyphens.';
  if (!b.title || b.title.trim().length < 3) f['title'] = 'Title must be 3–120 characters.';
  if (!db.categories.some((c) => c.id === Number(b.category_id))) f['category_id'] = 'Choose a category.';
  return f;
}

function handle(req: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  const url = req.url.split('?')[0];
  const path = url.replace(/^.*\/api/, '');
  const m = req.method;
  const b = (req.body ?? {}) as Any;
  const p = req.params;

  if (m === 'GET' && path === '/meta') return ok({ projectTypes: TYPES, budgetRanges: BUDGETS });
  if (m === 'GET' && path === '/categories') {
    return ok([...db.categories].sort((a, c) => a.sort_order - c.sort_order)
      .map((c) => ({ ...c, project_count: db.projects.filter((x) => x.category_id === c.id && x.published).length })));
  }
  if (m === 'GET' && path === '/projects') {
    let list = db.projects.filter((x) => x.published).map(withCategory);
    const cat = p.get('category'); const q = (p.get('q') ?? '').toLowerCase();
    if (cat) list = list.filter((x) => x.category.slug === cat);
    if (p.get('featured') === 'true') list = list.filter((x) => x.featured);
    if (q) list = list.filter((x) => [x.title, x.summary, x.location, x.style].join(' ').toLowerCase().includes(q));
    list.sort((a, c) => (p.get('sort') === 'oldest' ? a.year - c.year || a.id - c.id : c.year - a.year || c.id - a.id));
    return ok(list);
  }
  const detail = path.match(/^\/projects\/([^/]+)$/);
  if (m === 'GET' && detail) {
    const x = db.projects.find((y) => y.slug === decodeURIComponent(detail[1]) && y.published);
    if (!x) return fail(404, { error: 'Project not found' }, url);
    const related = db.projects.filter((y) => y.category_id === x.category_id && y.id !== x.id && y.published).slice(0, 3).map(withCategory);
    return ok({ ...withCategory(x), related });
  }
  if (m === 'POST' && path === '/enquiries') {
    const f: Any = {};
    if (!b['name'] || b['name'].trim().length < 2) f['name'] = 'Please enter your name (2–80 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b['email'] ?? '')) f['email'] = 'Please enter a valid email address.';
    if (b['phone'] && !/^[+\d][\d\s-]{6,18}$/.test(b['phone'])) f['phone'] = 'Please enter a valid phone number.';
    if (!b['message'] || b['message'].trim().length < 10) f['message'] = 'Please describe your project (10–2000 characters).';
    if (Object.keys(f).length) return fail(422, { error: 'Validation failed', fields: f }, url);
    const e = { id: db.seq.enquiry++, name: b['name'], email: b['email'], phone: b['phone'] ?? '', project_type: b['project_type'] ?? '',
      budget_range: b['budget_range'] ?? '', message: b['message'], project_slug: b['project_slug'] ?? '', status: 'new', created_at: now() };
    db.enquiries.unshift(e);
    return ok({ ok: true, id: e.id }, 201);
  }
  if (m === 'POST' && path === '/admin/login') {
    if (b['username'] === DEMO_USER && b['password'] === DEMO_PASSWORD) return ok({ token: 'demo.token', username: DEMO_USER });
    return fail(401, { error: `Invalid username or password (demo login: ${DEMO_USER} / ${DEMO_PASSWORD})` }, url);
  }
  if (path.startsWith('/admin/')) {
    if (req.headers.get('Authorization') !== 'Bearer demo.token') return fail(401, { error: 'Authentication required' }, url);
    if (m === 'GET' && path === '/admin/stats') {
      return ok({ projects: db.projects.length, published: db.projects.filter((x) => x.published).length, categories: db.categories.length,
        newEnquiries: db.enquiries.filter((x) => x.status === 'new').length, enquiries: db.enquiries.length });
    }
    if (m === 'GET' && path === '/admin/images') return ok(IMAGES);
    if (m === 'GET' && path === '/admin/projects') return ok([...db.projects].sort((a, c) => c.updated_at.localeCompare(a.updated_at) || c.id - a.id).map(withCategory));
    const pid = path.match(/^\/admin\/projects\/(\d+)$/);
    if (m === 'GET' && pid) {
      const x = db.projects.find((y) => y.id === Number(pid[1]));
      return x ? ok(withCategory(x)) : fail(404, { error: 'Project not found' }, url);
    }
    if ((m === 'POST' && path === '/admin/projects') || (m === 'PUT' && pid)) {
      const f = validateProject(b);
      const id = pid ? Number(pid[1]) : null;
      if (db.projects.some((y) => y.slug === b['slug'] && y.id !== id)) f['slug'] = 'Another project already uses this slug.';
      if (Object.keys(f).length) return fail(f['slug']?.startsWith('Another') ? 409 : 422, { error: 'Validation failed', fields: f }, url);
      const rec = { ...b, category_id: Number(b['category_id']), featured: !!b['featured'], published: b['published'] !== false, updated_at: now() };
      if (id === null) {
        const x = { ...rec, id: db.seq.project++, created_at: now() };
        db.projects.push(x);
        return ok(withCategory(x), 201);
      }
      const i = db.projects.findIndex((y) => y.id === id);
      if (i < 0) return fail(404, { error: 'Project not found' }, url);
      db.projects[i] = { ...db.projects[i], ...rec };
      return ok(withCategory(db.projects[i]));
    }
    if (m === 'DELETE' && pid) { db.projects = db.projects.filter((y) => y.id !== Number(pid[1])); return ok(null, 204); }
    const cid = path.match(/^\/admin\/categories\/(\d+)$/);
    if ((m === 'POST' && path === '/admin/categories') || (m === 'PUT' && cid)) {
      const id = cid ? Number(cid[1]) : null;
      if (!SLUG.test(b['slug'] ?? '')) return fail(422, { error: 'Validation failed', fields: { slug: 'Slug must be lowercase words joined by hyphens.' } }, url);
      if (db.categories.some((c) => c.slug === b['slug'] && c.id !== id)) return fail(409, { error: 'Validation failed', fields: { slug: 'Slug already in use.' } }, url);
      const rec = { slug: b['slug'], name: b['name'], description: b['description'] ?? '', sort_order: Number(b['sort_order'] ?? 0) };
      if (id === null) { const c = { id: db.seq.category++, ...rec }; db.categories.push(c); return ok(c, 201); }
      const c = db.categories.find((x) => x.id === id);
      if (!c) return fail(404, { error: 'Category not found' }, url);
      Object.assign(c, rec);
      return ok(c);
    }
    if (m === 'DELETE' && cid) {
      const used = db.projects.filter((y) => y.category_id === Number(cid[1])).length;
      if (used) return fail(409, { error: `Category has ${used} project(s). Move or delete them first.` }, url);
      db.categories = db.categories.filter((c) => c.id !== Number(cid[1]));
      return ok(null, 204);
    }
    if (m === 'GET' && path === '/admin/enquiries') {
      const s = p.get('status');
      return ok(s ? db.enquiries.filter((e) => e.status === s) : db.enquiries);
    }
    const eid = path.match(/^\/admin\/enquiries\/(\d+)$/);
    if (m === 'PATCH' && eid) {
      const e = db.enquiries.find((x) => x.id === Number(eid[1]));
      if (!e) return fail(404, { error: 'Enquiry not found' }, url);
      e['status'] = b['status'];
      return ok(e);
    }
    if (m === 'DELETE' && eid) { db.enquiries = db.enquiries.filter((x) => x.id !== Number(eid[1])); return ok(null, 204); }
  }
  return fail(404, { error: 'Not found' }, url);
}

export const demoApiInterceptor: HttpInterceptorFn = (req, next) => (req.url.startsWith('/api') ? handle(req) : next(req));
