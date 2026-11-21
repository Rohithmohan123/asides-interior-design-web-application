// End-to-end smoke test: starts the production server on a throwaway database, drives a real
// Chromium/Chrome through the public site and the admin CMS, and saves screenshots to docs/screenshots.
//
// Requirements: `npm run build` first, and a Chrome/Chromium binary. Set CHROME_PATH if it is not
// at a standard location, or run `npx playwright install chromium` once.
//
// Usage: npm run e2e

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shots = resolve(root, 'docs/screenshots');
mkdirSync(shots, { recursive: true });

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
const dbPath = resolve(tmpdir(), `asides-e2e-${Date.now()}.db`);
const ADMIN = { user: 'e2e-admin', pass: 'e2e-only-password-0001' };

if (!existsSync(resolve(root, 'frontend/dist/asides-frontend/browser/index.html'))) {
  console.error('Build the frontend first: npm run build');
  process.exit(1);
}

const server = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', 'src/server.js'], {
  cwd: resolve(root, 'backend'),
  env: { ...process.env, PORT: String(PORT), DB_PATH: dbPath, ADMIN_USERNAME: ADMIN.user, ADMIN_PASSWORD: ADMIN.pass, ADMIN_TOKEN_SECRET: 'e2e', ENQUIRY_RATE_LIMIT: '20' },
  stdio: ['ignore', 'pipe', 'inherit']
});
await new Promise((ok, fail) => {
  server.stdout.on('data', (d) => { if (String(d).includes('listening')) ok(); });
  server.on('exit', (code) => fail(new Error(`server exited (${code})`)));
});

const candidates = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

const results = [];
// Scroll through the page so lazy-loaded images load before a full-page screenshot.
async function loadAll(pg) {
  // Full-page screenshots: load every lazy image and un-stick the header so it is not painted mid-page.
  await pg.addStyleTag({ content: '.header { position: static !important; }' });
  await pg.evaluate(async () => {
    const imgs = [...document.images];
    imgs.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    window.scrollTo(0, 0);
  });
  await pg.waitForLoadState('networkidle');
}
let activePage;
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); console.log(`  ✔ ${name}`); }
  catch (err) {
    results.push(['FAIL', name]);
    console.log(`  ✘ ${name}\n    ${err.message.split('\n')[0]}`);
    if (process.env.E2E_DEBUG) await activePage?.screenshot({ path: resolve(tmpdir(), `e2e-fail-${results.length}.png`) }).catch(() => {});
  }
}

try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  activePage = page;
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('dialog', (d) => d.accept());

  console.log('Public site');
  await step('home page renders featured projects and categories', async () => {
    await page.goto(BASE + '/');
    await page.getByRole('heading', { name: 'Selected work' }).waitFor();
    await page.locator('app-project-card').first().waitFor();
    await page.locator('a.cat.card').first().waitFor();
    assert.equal(await page.locator('a.cat.card').count(), 6);
    await loadAll(page);
    await page.screenshot({ path: `${shots}/01-home.png`, fullPage: true });
  });

  await step('projects page filters by category', async () => {
    await page.goto(BASE + '/projects');
    await page.locator('app-project-card').first().waitFor();
    assert.equal(await page.locator('app-project-card').count(), 10);
    await page.getByRole('button', { name: 'Kitchens' }).click();
    await page.waitForURL(/category=kitchens/);
    await page.waitForFunction(() => document.querySelectorAll('app-project-card').length === 2);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${shots}/02-projects-filtered.png` });
  });

  await step('projects page search narrows results', async () => {
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByPlaceholder('Search projects…').fill('Fort Kochi');
    await page.waitForURL(/q=Fort/);
    await page.waitForFunction(() => document.querySelectorAll('app-project-card').length === 1);
    await page.getByPlaceholder('Search projects…').fill('zzzz-no-match');
    await page.getByText('No projects match your filters.').waitFor();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.waitForFunction(() => document.querySelectorAll('app-project-card').length === 10);
  });

  await step('project detail page with gallery and related projects', async () => {
    await page.goto(BASE + '/projects/sage-modular-kitchen');
    await page.getByRole('heading', { level: 1, name: 'Sage Modular Kitchen' }).waitFor();
    await page.getByRole('tab', { name: 'Show image 2' }).click();
    await page.waitForFunction(() => document.querySelector('img.main')?.getAttribute('src')?.includes('detail-1'));
    await page.getByRole('tab', { name: 'Show image 1' }).click();
    assert.equal(await page.locator('h2', { hasText: 'More kitchens' }).count(), 1);
    await loadAll(page);
    await page.screenshot({ path: `${shots}/03-project-detail.png`, fullPage: true });
  });

  await step('unknown project shows a not-found message', async () => {
    await page.goto(BASE + '/projects/not-a-real-project');
    await page.getByRole('heading', { name: 'Project not found' }).waitFor();
  });

  await step('enquiry form validates and submits', async () => {
    await page.goto(BASE + '/contact');
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await page.getByText('Please enter your name.').waitFor();
    await page.screenshot({ path: `${shots}/04-contact-validation.png` });
    await page.getByLabel('Your name *').fill('Asha Menon');
    await page.getByLabel('Email *').fill('asha@example.com');
    await page.getByLabel('Phone').fill('+91 98765 43210');
    await page.getByLabel('Project type').selectOption('Kitchen');
    await page.getByLabel('Budget range').selectOption({ index: 2 });
    await page.getByLabel('Tell us about your space *').fill('We would like to redesign a 10 x 12 ft kitchen with more storage.');
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await page.getByText('your enquiry has been received').waitFor();
  });

  await step('mobile navigation opens and closes', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const mp = await m.newPage();
    await mp.goto(BASE + '/');
    await mp.locator('app-project-card').first().waitFor();
    await mp.screenshot({ path: `${shots}/05a-mobile-home.png` });
    await mp.getByRole('button', { name: 'Open menu' }).click();
    await mp.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' }).waitFor();
    await mp.screenshot({ path: `${shots}/05-mobile-menu.png` });
    await mp.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' }).click();
    await mp.waitForURL(/\/projects$/);
    assert.equal(await mp.getByRole('button', { name: 'Open menu' }).count(), 1);
    await m.close();
  });

  console.log('Admin CMS');
  await step('admin route redirects to login when signed out', async () => {
    await page.goto(BASE + '/admin/projects');
    await page.waitForURL(/\/admin\/login$/);
  });

  await step('wrong password is rejected', async () => {
    await page.getByLabel('Username').fill(ADMIN.user);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Invalid username or password').waitFor();
  });

  await step('admin signs in and sees dashboard with the new enquiry', async () => {
    await page.getByLabel('Password').fill(ADMIN.pass);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/admin$/);
    await page.getByRole('cell', { name: 'Asha Menon' }).waitFor();
    await page.screenshot({ path: `${shots}/06-admin-dashboard.png` });
  });

  await step('admin creates a project and it appears on the public site', async () => {
    await page.goto(BASE + '/admin/projects/new');
    await page.getByLabel('Title *').fill('Coastal Verandah');
    assert.equal(await page.getByLabel('URL slug *').inputValue(), 'coastal-verandah');
    await page.getByLabel('Category *').selectOption({ label: 'Living Rooms' });
    await page.getByLabel('Location').fill('Cherai');
    await page.getByLabel('Area (sq ft)').fill('260');
    await page.getByLabel('Summary').fill('A sample verandah lounge added through the admin CMS during the end-to-end test.');
    await page.getByLabel('Highlights').fill('Weatherproof seating\nCeiling fan with cane blades');
    await page.getByLabel('Materials').fill('Cane\nTeak');
    await page.getByLabel('Cover image').selectOption('/images/projects/teak-and-linen-living-room.svg');
    await page.locator('img.preview').evaluate((img) => img.complete || new Promise((r) => { img.onload = r; }));
    await page.screenshot({ path: `${shots}/07-admin-project-form.png`, fullPage: true });
    await page.getByRole('button', { name: 'Save project' }).click();
    await page.waitForURL(/\/admin\/projects$/);
    await page.getByText('Coastal Verandah').waitFor();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${shots}/08-admin-projects.png` });
    const res = await page.request.get(BASE + '/api/projects/coastal-verandah');
    assert.equal(res.status(), 200);
  });

  await step('admin unpublishes the project and it disappears publicly', async () => {
    await page.getByRole('link', { name: 'Edit Coastal Verandah' }).click();
    await page.getByLabel('Title *').waitFor();
    await page.waitForFunction(() => document.querySelector('#title')?.value === 'Coastal Verandah');
    await page.getByLabel('Published (visible on the site)').uncheck();
    await page.getByRole('button', { name: 'Save project' }).click();
    await page.waitForURL(/\/admin\/projects$/);
    assert.equal((await page.request.get(BASE + '/api/projects/coastal-verandah')).status(), 404);
  });

  await step('duplicate slug shows a field error', async () => {
    await page.goto(BASE + '/admin/projects/new');
    await page.getByLabel('Title *').fill('Another Kitchen');
    await page.getByLabel('URL slug *').fill('sage-modular-kitchen');
    await page.getByLabel('Category *').selectOption({ label: 'Kitchens' });
    await page.getByRole('button', { name: 'Save project' }).click();
    await page.getByText('Another project already uses this slug.').waitFor();
  });

  await step('admin manages categories', async () => {
    await page.goto(BASE + '/admin/categories');
    await page.getByLabel('Name').fill('Outdoor Spaces');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByText('Added "Outdoor Spaces".').waitFor();
    await page.getByRole('button', { name: 'Delete Kitchens' }).click();
    await page.getByText(/Category has \d+ project/).waitFor();
    await page.screenshot({ path: `${shots}/09-admin-categories.png` });
  });

  await step('admin updates enquiry status', async () => {
    await page.goto(BASE + '/admin/enquiries');
    await page.getByText('Asha Menon').waitFor();
    await page.locator('article.enquiry select').first().selectOption('contacted');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Contacted' }).click();
    await page.getByText('Asha Menon').waitFor();
    await page.screenshot({ path: `${shots}/10-admin-enquiries.png` });
  });

  await step('admin signs out', async () => {
    await page.getByRole('button', { name: /Sign out/ }).click();
    await page.waitForURL(/\/admin\/login$/);
  });

  await step('no browser console errors (other than expected 4xx responses)', async () => {
    const unexpected = consoleErrors.filter((e) => !/status of (401|404|409|422)/.test(e));
    assert.deepEqual(unexpected, []);
  });
} finally {
  await browser.close();
  server.kill();
  rmSync(dbPath, { force: true });
}

const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} checks passed. Screenshots: docs/screenshots/`);
process.exit(failed ? 1 : 0);
