import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../../api/form-log.js';

test('POST /api/form-log responde 200 em dry-run e registra o payload', async () => {
  const originalInfo = console.info;
  let logged;
  console.info = entry => { logged = JSON.parse(entry); };
  const res = { code: 0, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    await handler({ method: 'POST', headers: { host: 'example.test', origin: 'https://example.test', 'sec-fetch-site': 'same-origin' }, body: { dry_run: true, payload: { lead_score: 100, value: 100 } } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.ok, true);
    assert.equal(logged.dry_run, true);
    assert.equal(logged.payload.payload.lead_score, 100);
  } finally { console.info = originalInfo; }
});
