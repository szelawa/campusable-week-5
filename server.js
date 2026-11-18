// CampusAble backend: a small REST API built with Node's built-in modules only.
// Run: npm run server   (listens on http://127.0.0.1:3000)
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'dist', 'campusable', 'browser');
const MAX_BODY_BYTES = 10 * 1024;

// Read settings such as ADMIN_TOKEN from server/.env (works the same on Windows, Mac, and Linux).
// A value already set in the environment wins.
(function loadEnvFile() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
})();
const MAX_MESSAGE_LENGTH = 300;

// ---------- storage (JSON files) ----------

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

function writeJson(file, value) {
  const target = path.join(DATA_DIR, file);
  const temp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temp, target); // replace in one step so a crash never leaves half a file
}

const getBuildings = () => readJson('buildings.json', []);
const getClosures = () => readJson('closures.json', []);
const saveClosures = closures => writeJson('closures.json', closures);

function isActive(closure, now = new Date()) {
  return closure.status === 'active' && (!closure.endsAt || new Date(closure.endsAt) > now);
}

// ---------- helpers ----------

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Body must be valid JSON.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

// Admin routes need "Authorization: Bearer <ADMIN_TOKEN>".
// Returns null when allowed, or [status, message] when not.
function checkAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return [503, 'Admin updates are turned off. Set ADMIN_TOKEN to turn them on.'];
  const header = req.headers.authorization || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!given || !crypto.timingSafeEqual(a, b)) return [401, 'Missing or wrong admin token.'];
  return null;
}

function validateClosure(body, buildings) {
  const buildingId = Number(body.buildingId);
  if (!buildings.some(b => b.id === buildingId)) return 'buildingId must match one of the campus buildings.';
  if (typeof body.message !== 'string' || !body.message.trim()) return 'message is required.';
  if (body.message.trim().length > MAX_MESSAGE_LENGTH) return `message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  if (body.endsAt !== undefined && body.endsAt !== null && body.endsAt !== '') {
    const end = new Date(body.endsAt);
    if (Number.isNaN(end.getTime())) return 'endsAt must be a valid date and time.';
    if (end <= new Date()) return 'endsAt must be in the future.';
  }
  return null;
}

// ---------- API routes ----------

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ["api", ...]
  const method = req.method;

  // GET /api/health
  if (method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { status: 'ok' });
  }

  // GET /api/buildings
  if (method === 'GET' && url.pathname === '/api/buildings') {
    return send(res, 200, getBuildings());
  }

  // GET /api/buildings/:id  and  GET /api/buildings/:id/closures
  if (method === 'GET' && parts[1] === 'buildings' && parts.length >= 3 && parts.length <= 4) {
    const id = Number(parts[2]);
    const building = getBuildings().find(b => b.id === id);
    if (!building) return send(res, 404, { error: 'Building not found.' });
    if (parts.length === 3) return send(res, 200, building);
    if (parts[3] === 'closures') {
      return send(res, 200, getClosures().filter(c => c.buildingId === id && isActive(c)));
    }
  }

  // GET /api/closures (admin): every closure, including cleared ones
  if (method === 'GET' && url.pathname === '/api/closures') {
    const denied = checkAdmin(req);
    if (denied) return send(res, denied[0], { error: denied[1] });
    return send(res, 200, getClosures());
  }

  // POST /api/closures (admin): post a new closure
  if (method === 'POST' && url.pathname === '/api/closures') {
    const denied = checkAdmin(req);
    if (denied) return send(res, denied[0], { error: denied[1] });
    const body = await readBody(req);
    const problem = validateClosure(body, getBuildings());
    if (problem) return send(res, 400, { error: problem });
    const closure = {
      id: crypto.randomUUID(),
      buildingId: Number(body.buildingId),
      message: body.message.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      endsAt: body.endsAt ? new Date(body.endsAt).toISOString() : null
    };
    const closures = getClosures();
    closures.push(closure);
    saveClosures(closures);
    return send(res, 201, closure);
  }

  // DELETE /api/closures/:id (admin): clear a closure (kept as history)
  if (method === 'DELETE' && parts[1] === 'closures' && parts.length === 3) {
    const denied = checkAdmin(req);
    if (denied) return send(res, denied[0], { error: denied[1] });
    const closures = getClosures();
    const closure = closures.find(c => c.id === parts[2]);
    if (!closure) return send(res, 404, { error: 'Closure not found.' });
    closure.status = 'cleared';
    closure.clearedAt = new Date().toISOString();
    saveClosures(closures);
    return send(res, 200, closure);
  }

  return send(res, 404, { error: 'Not found.' });
}

// ---------- static files (built Angular app, for deployment) ----------

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.ico': 'image/x-icon',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8'
};

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  const root = path.resolve(STATIC_DIR);
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) && file !== root) return send(res, 403, { error: 'Forbidden.' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Front end not built. Run "npm run build", or use "npm start" for development.');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

// ---------- server ----------

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      return serveStatic(req, res, url);
    } catch (error) {
      if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'Server error.' });
      if (!error.status) console.error(error);
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
  createServer().listen(port, host, () => {
    console.log(`CampusAble API running at http://${host}:${port}/api/buildings`);
    if (!process.env.ADMIN_TOKEN) console.log('Admin updates are off. Set ADMIN_TOKEN to turn them on.');
  });
}

module.exports = { createServer };
