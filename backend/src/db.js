import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  location     TEXT    NOT NULL DEFAULT '',
  area_sqft    INTEGER,
  year         INTEGER,
  style        TEXT    NOT NULL DEFAULT '',
  summary      TEXT    NOT NULL DEFAULT '',
  description  TEXT    NOT NULL DEFAULT '',
  highlights   TEXT    NOT NULL DEFAULT '[]',  -- JSON array of strings
  materials    TEXT    NOT NULL DEFAULT '[]',  -- JSON array of strings
  cover_image  TEXT    NOT NULL DEFAULT '',
  gallery      TEXT    NOT NULL DEFAULT '[]',  -- JSON array of image paths
  featured     INTEGER NOT NULL DEFAULT 0,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id);

CREATE TABLE IF NOT EXISTS enquiries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT '',
  budget_range TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL,
  project_slug TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDatabase(path = process.env.DB_PATH || 'data/asides.db') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

const JSON_FIELDS = ['highlights', 'materials', 'gallery'];

/** Convert a raw projects row (with joined category columns) into an API object. */
export function toProject(row) {
  if (!row) return null;
  const out = { ...row };
  for (const f of JSON_FIELDS) {
    try { out[f] = JSON.parse(row[f] ?? '[]'); } catch { out[f] = []; }
  }
  out.featured = Boolean(row.featured);
  out.published = Boolean(row.published);
  if ('category_slug' in row) {
    out.category = { id: row.category_id, slug: row.category_slug, name: row.category_name };
    delete out.category_slug;
    delete out.category_name;
  }
  return out;
}

export const PROJECT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM projects p JOIN categories c ON c.id = p.category_id
`;
