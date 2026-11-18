// Run: npm run test:server
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Use a temporary copy of the data so tests never change the real files.
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusable-'));
fs.copyFileSync(path.join(__dirname, 'data', 'buildings.json'), path.join(tempDir, 'buildings.json'));
process.env.DATA_DIR = tempDir;
process.env.ADMIN_TOKEN = 'test-admin-token';

const { createServer } = require('./server');
let server;
let base;
const admin = { Authorization: 'Bearer test-admin-token', 'Content-Type': 'application/json' };

before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('lists the four campus buildings', async () => {
  const res = await fetch(`${base}/api/buildings`);
  assert.equal(res.status, 200);
  const buildings = await res.json();
  assert.deepEqual(buildings.map(b => b.name),
    ['Innovation Hall', 'Johnson Center (JC)', 'Horizon Hall', 'Fenwick Library']);
});

test('returns one building, and 404 for an unknown id', async () => {
  const ok = await fetch(`${base}/api/buildings/4`);
  assert.equal((await ok.json()).name, 'Fenwick Library');
  const missing = await fetch(`${base}/api/buildings/99`);
  assert.equal(missing.status, 404);
});

test('admin routes reject a missing or wrong token', async () => {
  const body = JSON.stringify({ buildingId: 1, message: 'Elevator out' });
  const none = await fetch(`${base}/api/closures`, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  assert.equal(none.status, 401);
  const wrong = await fetch(`${base}/api/closures`, { method: 'POST', body, headers: { ...admin, Authorization: 'Bearer nope' } });
  assert.equal(wrong.status, 401);
});

test('rejects invalid closures', async () => {
  const cases = [
    { buildingId: 99, message: 'x' },
    { buildingId: 1, message: '   ' },
    { buildingId: 1, message: 'x'.repeat(301) },
    { buildingId: 1, message: 'ok', endsAt: 'not a date' },
    { buildingId: 1, message: 'ok', endsAt: '2000-01-01T00:00:00Z' }
  ];
  for (const body of cases) {
    const res = await fetch(`${base}/api/closures`, { method: 'POST', headers: admin, body: JSON.stringify(body) });
    assert.equal(res.status, 400, JSON.stringify(body));
  }
  const badJson = await fetch(`${base}/api/closures`, { method: 'POST', headers: admin, body: '{oops' });
  assert.equal(badJson.status, 400);
});

test('admin posts a closure, students see it, admin clears it', async () => {
  const posted = await fetch(`${base}/api/closures`, {
    method: 'POST', headers: admin,
    body: JSON.stringify({ buildingId: 2, message: '  North entrance closed for repairs.  ' })
  });
  assert.equal(posted.status, 201);
  const closure = await posted.json();
  assert.equal(closure.message, 'North entrance closed for repairs.');

  let active = await (await fetch(`${base}/api/buildings/2/closures`)).json();
  assert.equal(active.length, 1);
  const other = await (await fetch(`${base}/api/buildings/1/closures`)).json();
  assert.equal(other.length, 0);

  const cleared = await fetch(`${base}/api/closures/${closure.id}`, { method: 'DELETE', headers: admin });
  assert.equal(cleared.status, 200);
  active = await (await fetch(`${base}/api/buildings/2/closures`)).json();
  assert.equal(active.length, 0);

  const all = await (await fetch(`${base}/api/closures`, { headers: admin })).json();
  assert.equal(all.find(c => c.id === closure.id).status, 'cleared');
});

test('expired closures are hidden from students', async () => {
  const file = path.join(tempDir, 'closures.json');
  fs.writeFileSync(file, JSON.stringify([{ id: 'old', buildingId: 3, message: 'Old', status: 'active', endsAt: '2000-01-01T00:00:00Z' }]));
  const active = await (await fetch(`${base}/api/buildings/3/closures`)).json();
  assert.equal(active.length, 0);
});

test('unknown API routes return 404', async () => {
  const res = await fetch(`${base}/api/nothing-here`);
  assert.equal(res.status, 404);
});
