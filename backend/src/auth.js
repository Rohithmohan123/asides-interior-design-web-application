import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

// Minimal signed-token auth for a single admin user. Credentials come from environment
// variables (see .env.example) and are never stored in the repository.

const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function secret() {
  if (!process.env.ADMIN_TOKEN_SECRET) {
    // A random per-process secret: tokens simply stop working after a restart.
    process.env.ADMIN_TOKEN_SECRET = randomBytes(32).toString('hex');
  }
  return process.env.ADMIN_TOKEN_SECRET;
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

export function checkCredentials(username, password) {
  if (!adminConfigured()) return false;
  // Evaluate both comparisons so timing does not reveal which field was wrong.
  const u = safeEqual(username ?? '', process.env.ADMIN_USERNAME);
  const p = safeEqual(password ?? '', process.env.ADMIN_PASSWORD);
  return u && p;
}

export function issueToken(username, now = Date.now()) {
  const payload = b64url(JSON.stringify({ sub: username, exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token, now = Date.now()) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp !== 'number' || data.exp < Math.floor(now / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.admin = user;
  next();
}
