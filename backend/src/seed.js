import { openDatabase } from './db.js';
import { categories, projects } from './seed-data.js';
import { pathToFileURL } from 'node:url';

/** Insert sample content. With reset=true all existing rows are removed first. */
export function seed(db, { reset = false } = {}) {
  if (reset) db.exec('DELETE FROM enquiries; DELETE FROM projects; DELETE FROM categories;');
  const existing = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
  if (existing > 0) return false;

  const insCat = db.prepare('INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)');
  const insProj = db.prepare(`INSERT INTO projects
    (slug, title, category_id, location, area_sqft, year, style, summary, description,
     highlights, materials, cover_image, gallery, featured, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  db.exec('BEGIN');
  try {
    const ids = {};
    for (const c of categories) {
      ids[c.slug] = Number(insCat.run(c.slug, c.name, c.description, c.sort_order).lastInsertRowid);
    }
    for (const p of projects) {
      insProj.run(p.slug, p.title, ids[p.category], p.location, p.area_sqft, p.year, p.style, p.summary,
        p.description, JSON.stringify(p.highlights), JSON.stringify(p.materials), p.cover_image,
        JSON.stringify(p.gallery), p.featured, p.published);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return true;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase();
  const done = seed(db, { reset: process.argv.includes('--reset') });
  console.log(done ? `Seeded ${categories.length} categories and ${projects.length} sample projects.` : 'Database already has content; use --reset to re-seed.');
}
