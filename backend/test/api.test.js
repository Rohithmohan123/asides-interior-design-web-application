import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { seed } from '../src/seed.js';
import { createApp } from '../src/app.js';
import { issueToken, verifyToken } from '../src/auth.js';

process.env.ADMIN_USERNAME = 'tester';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.ADMIN_TOKEN_SECRET = 'test-secret';
process.env.ENQUIRY_RATE_LIMIT = '50';

let server;
let base;
let token;

async function call(method, path, body, auth = false) {
  const headers = { 'content-type': 'application/json' };
  if (auth) headers.authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
  const db = openDatabase(':memory:');
  seed(db);
  const app = createApp(db);
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

describe('public API', () => {
  test('health check', async () => {
    const r = await call('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'ok');
  });

  test('lists categories with project counts', async () => {
    const r = await call('GET', '/categories');
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 6);
    const kitchens = r.body.find((c) => c.slug === 'kitchens');
    assert.equal(kitchens.project_count, 2);
  });

  test('lists published projects and parses JSON fields', async () => {
    const r = await call('GET', '/projects');
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 10);
    assert.ok(Array.isArray(r.body[0].highlights));
    assert.ok(r.body[0].category.slug);
  });

  test('filters by category, featured flag and search text', async () => {
    assert.equal((await call('GET', '/projects?category=commercial')).body.length, 2);
    assert.ok((await call('GET', '/projects?featured=true')).body.every((p) => p.featured));
    const q = await call('GET', '/projects?q=Fort%20Kochi');
    assert.deepEqual(q.body.map((p) => p.slug), ['filter-coffee-cafe']);
  });

  test('returns project details with related projects', async () => {
    const r = await call('GET', '/projects/sage-modular-kitchen');
    assert.equal(r.status, 200);
    assert.equal(r.body.title, 'Sage Modular Kitchen');
    assert.deepEqual(r.body.related.map((p) => p.slug), ['charcoal-island-kitchen']);
  });

  test('404 for unknown project', async () => {
    assert.equal((await call('GET', '/projects/does-not-exist')).status, 404);
  });

  test('accepts a valid enquiry', async () => {
    const r = await call('POST', '/enquiries', {
      name: 'Asha Menon', email: 'asha@example.com', phone: '+91 98765 43210',
      project_type: 'Kitchen', budget_range: '₹2–5 lakh', message: 'Looking to redo a small L-shaped kitchen.'
    });
    assert.equal(r.status, 201);
    assert.ok(r.body.id > 0);
  });

  test('rejects an invalid enquiry with field errors', async () => {
    const r = await call('POST', '/enquiries', { name: 'A', email: 'not-an-email', message: 'short' });
    assert.equal(r.status, 422);
    assert.ok(r.body.fields.name && r.body.fields.email && r.body.fields.message);
  });

  test('malformed JSON gives a 400, not a crash', async () => {
    const res = await fetch(base + '/enquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
    assert.equal(res.status, 400);
  });
});

describe('admin API', () => {
  test('rejects requests without a token', async () => {
    assert.equal((await call('GET', '/admin/projects')).status, 401);
  });

  test('rejects wrong credentials', async () => {
    assert.equal((await call('POST', '/admin/login', { username: 'tester', password: 'wrong' })).status, 401);
  });

  test('logs in and reads stats', async () => {
    const r = await call('POST', '/admin/login', { username: 'tester', password: 'test-password-123' });
    assert.equal(r.status, 200);
    token = r.body.token;
    const s = await call('GET', '/admin/stats', null, true);
    assert.equal(s.status, 200);
    assert.equal(s.body.projects, 10);
    assert.equal(s.body.newEnquiries, 1);
  });

  test('creates, updates, unpublishes and deletes a project', async () => {
    const cats = (await call('GET', '/categories')).body;
    const payload = {
      slug: 'test-studio', title: 'Test Studio', category_id: cats[0].id, location: 'Kochi',
      area_sqft: 100, year: 2025, summary: 'A test.', highlights: ['One'], materials: ['Oak'],
      cover_image: '/images/projects/sage-modular-kitchen.svg', featured: true
    };
    const created = await call('POST', '/admin/projects', payload, true);
    assert.equal(created.status, 201);
    assert.equal(created.body.featured, true);
    const id = created.body.id;

    const dup = await call('POST', '/admin/projects', payload, true);
    assert.equal(dup.status, 409);

    const updated = await call('PUT', `/admin/projects/${id}`, { ...payload, title: 'Test Studio Revised', published: false }, true);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, 'Test Studio Revised');
    assert.equal((await call('GET', '/projects/test-studio')).status, 404, 'unpublished project is hidden publicly');

    assert.equal((await call('DELETE', `/admin/projects/${id}`, null, true)).status, 204);
    assert.equal((await call('GET', `/admin/projects/${id}`, null, true)).status, 404);
  });

  test('validates project input', async () => {
    const r = await call('POST', '/admin/projects', { slug: 'Bad Slug', title: 'x', category_id: 'abc', cover_image: 'http://evil' }, true);
    assert.equal(r.status, 422);
    assert.ok(r.body.fields.slug && r.body.fields.title && r.body.fields.category_id && r.body.fields.cover_image);
  });

  test('manages categories and protects categories in use', async () => {
    const c = await call('POST', '/admin/categories', { slug: 'outdoor', name: 'Outdoor' }, true);
    assert.equal(c.status, 201);
    const kitchens = (await call('GET', '/categories')).body.find((x) => x.slug === 'kitchens');
    assert.equal((await call('DELETE', `/admin/categories/${kitchens.id}`, null, true)).status, 409);
    assert.equal((await call('DELETE', `/admin/categories/${c.body.id}`, null, true)).status, 204);
  });

  test('lists and updates enquiry status', async () => {
    const list = await call('GET', '/admin/enquiries', null, true);
    assert.equal(list.body.length, 1);
    const id = list.body[0].id;
    const r = await call('PATCH', `/admin/enquiries/${id}`, { status: 'contacted' }, true);
    assert.equal(r.body.status, 'contacted');
    assert.equal((await call('PATCH', `/admin/enquiries/${id}`, { status: 'bogus' }, true)).status, 422);
  });
});

describe('auth tokens', () => {
  test('expired and tampered tokens are rejected', () => {
    const t = issueToken('tester', Date.now() - 9 * 60 * 60 * 1000);
    assert.equal(verifyToken(t), null);
    const good = issueToken('tester');
    assert.ok(verifyToken(good));
    assert.equal(verifyToken(good.slice(0, -2) + 'xx'), null);
  });
});
