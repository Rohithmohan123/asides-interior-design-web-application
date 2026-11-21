import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { openDatabase } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';
import { adminConfigured } from './auth.js';

const here = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(here, '../../frontend');

const db = openDatabase();
if (seed(db)) console.log('Empty database detected: loaded sample content.');

const app = createApp(db, {
  staticDir: resolve(frontendDir, 'dist/asides-frontend/browser'),
  imagesDir: resolve(frontendDir, 'public/images/projects')
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`ASIDES API listening on http://localhost:${port}`);
  if (!adminConfigured()) console.warn('Admin login disabled: set ADMIN_USERNAME and ADMIN_PASSWORD in backend/.env');
});
