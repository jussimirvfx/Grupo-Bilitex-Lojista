import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import handler from '../../api/leads.js';

const originalFetch = globalThis.fetch;
const originalWebhook = process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL;

const validBody = {
  storeName: 'Loja Fictícia',
  contactName: 'Pessoa de Teste',
  whatsapp: '47999999999',
  cnpj: '60.887.522/0001-89',
  city: 'Itajaí',
  state: 'SC',
  instagram: '@lojateste',
  brandsSold: 'Marca A',
  storeType: 'Multimarcas',
  interestedBrand: 'As duas marcas',
  submittedAt: '2026-09-14T12:00:00.000Z',
  url: 'https://example.test/',
};

const createRequest = (body, ip) => ({
  method: 'POST',
  body,
  headers: {
    host: 'grupo-bilitex-lojista.vercel.app',
    origin: 'https://grupo-bilitex-lojista.vercel.app',
    'sec-fetch-site': 'same-origin',
    'x-forwarded-for': ip,
  },
});

const createResponse = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  end() {
    return this;
  },
});

beforeEach(() => {
  delete process.env.SINTEGRA_CNPJ_API_KEY;
  delete process.env.CRM_CNPJ_BEARER_TOKEN;
  process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL = 'https://webhook.example.test/lead';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWebhook === undefined) delete process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL;
  else process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL = originalWebhook;
});

test('bloqueia CNPJ inválido antes da cascata e do webhook', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('não deveria chamar fetch');
  };
  const response = createResponse();

  await handler(createRequest({ ...validBody, cnpj: '60.887.522/0001-88' }, '192.0.2.1'), response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { ok: false, error: 'invalid-cnpj' });
  assert.equal(calls, 0);
});

test('envia uma vez ao webhook com enriquecimento normalizado', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('brasilapi.com.br')) {
      return new Response(JSON.stringify({
        razao_social: 'Empresa Fictícia Ltda',
        nome_fantasia: 'Loja Fictícia',
        descricao_situacao_cadastral: 'ATIVA',
        data_inicio_atividade: '2020-01-02',
        municipio: 'Itajaí',
        uf: 'SC',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const response = createResponse();

  await handler(createRequest(validBody, '192.0.2.2'), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(calls.length, 2);
  assert.equal(calls.filter(({ url }) => url === 'https://webhook.example.test/lead').length, 1);
  const webhookCall = calls.find(({ url }) => url === 'https://webhook.example.test/lead');
  const payload = JSON.parse(webhookCall.options.body);
  assert.equal(payload.cnpj, '60.887.522/0001-89');
  assert.equal(payload.cnpj_digits, '60887522000189');
  assert.equal(payload.cnpj_validation_status, 'cadastral_valid');
  assert.equal(payload.fonte, 'BrasilAPI');
  assert.equal(payload.company.razao_social, 'Empresa Fictícia Ltda');
  assert.equal(payload.source, 'grupo-bilitex-lojista');
});

test('mantém a entrega checksum-only quando a cascata está indisponível', async () => {
  let webhookPayload;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('brasilapi.com.br')) {
      return new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    webhookPayload = JSON.parse(options.body);
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const response = createResponse();

  await handler(createRequest(validBody, '192.0.2.3'), response);

  assert.equal(response.statusCode, 200);
  assert.equal(webhookPayload.cnpj_validation_status, 'checksum_valid');
  assert.equal(webhookPayload.encontrado, false);
  assert.deepEqual(webhookPayload.fontes_consultadas, ['BrasilAPI']);
});
