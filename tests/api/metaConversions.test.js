import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/meta/conversions.js';

const body = { event_name: 'Lead', event_id: 'synthetic-lead-1', event_source_url: 'https://example.test/',
  user_data: { em: ['teste@example.com'], ph: ['a'.repeat(64)] }, custom_data: { lead_score: 100, value: 100 } };
const response = () => ({ statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });

test('conversões: dry-run, hash, falhas e credenciais', async t => {
  const original = { fetch: globalThis.fetch, info: console.info, error: console.error, env: { ...process.env } };
  let logs = [], calls = 0;
  console.info = console.error = message => logs.push(JSON.parse(message));
  process.env.META_PIXEL_ID = '2080143396195017';
  process.env.META_API_ACCESS_TOKEN = 'synthetic-secret';
  delete process.env.META_DRY_RUN;
  const req = (extra = {}, headers = {}) => ({ method: 'POST', body: { ...body, ...extra }, headers: { host: 'example.test', origin: 'https://example.test', 'user-agent': 'test-agent', 'x-forwarded-for': '192.0.2.1', ...headers } });
  try {
    await t.test('todos os aliases evitam qualquer chamada externa', async () => {
      globalThis.fetch = async () => { calls++; throw Error('unexpected-fetch'); };
      for (const alias of ['dry_run', 'dryRun', 'vfx_dry_run', 'skip_webhook']) {
        const res = response(); await handler(req({ [alias]: true }), res);
        assert.equal(res.statusCode, 200); assert.equal(res.body.skipped_meta, true);
      }
      const res = response(); await handler(req({}, { 'x-vfx-dry-run': '1' }), res);
      assert.equal(res.body.dry_run, true); assert.equal(calls, 0);
      assert.equal(logs.at(-1).event, 'conversion_api_event_backup');
      assert.equal(logs.at(-1).custom_data.lead_score, 100);
    });
    await t.test('erro Meta retorna 202 com payload recuperável e sem token', async () => {
      globalThis.fetch = async (_url, options) => {
        const payload = JSON.parse(options.body);
        assert.match(payload.data[0].user_data.em[0], /^[a-f0-9]{64}$/);
        assert.equal(payload.data[0].user_data.ph[0], 'a'.repeat(64));
        assert.equal(payload.data[0].user_data.client_ip_address, '192.0.2.1');
        assert.equal(logs.at(-1).event, 'conversion_api_event_backup');
        return { ok: false, status: 400, json: async () => ({ error: { message: 'synthetic-secret' } }) };
      };
      const res = response(); await handler(req({ access_token: 'synthetic-secret' }), res);
      assert.equal(res.statusCode, 202); assert.equal(res.body.delivered, false);
      const error = logs.at(-1);
      assert.equal(error.event, 'conversion_api_event_error');
      assert.equal(error.request_payload.event_id, body.event_id);
      assert.equal(error.prepared_meta_payload.data[0].event_id, body.event_id);
      assert.ok(!JSON.stringify(logs).includes('synthetic-secret'));
    });
    await t.test('erro interno preserva payload e não quebra envio', async () => {
      globalThis.fetch = async () => { throw Error('timeout'); };
      const res = response(); await handler(req(), res);
      assert.equal(res.statusCode, 202); assert.equal(logs.at(-1).error_message, 'timeout');
    });
    await t.test('produção ignora código de teste e preserva evento e score', async () => {
      process.env.VERCEL_ENV = 'production'; process.env.META_TEST_EVENT_CODE = 'TEST_ONLY';
      globalThis.fetch = async (_url, options) => {
        const payload = JSON.parse(options.body);
        assert.equal(payload.test_event_code, undefined);
        assert.equal(payload.data[0].custom_data.lead_score, 100);
        assert.equal(payload.data[0].event_id, body.event_id);
        return { ok: true, status: 200, json: async () => ({ events_received: 1 }) };
      };
      const res = response(); await handler(req(), res);
      assert.equal(res.statusCode, 200); assert.equal(res.body.delivered, true);
    });
    await t.test('rejeita origem estrangeira e evento inválido', async () => {
      const res = response(); await handler(req({}, { origin: 'https://other.test' }), res);
      assert.equal(res.statusCode, 403);
      const invalid = response(); await handler(req({ event_id: '' }), invalid);
      assert.equal(invalid.statusCode, 400);
    });
  } finally {
    globalThis.fetch = original.fetch; console.info = original.info; console.error = original.error;
    for (const key of ['META_PIXEL_ID', 'META_API_ACCESS_TOKEN', 'META_DRY_RUN', 'META_TEST_EVENT_CODE', 'VERCEL_ENV']) {
      if (original.env[key] === undefined) delete process.env[key]; else process.env[key] = original.env[key];
    }
  }
});
