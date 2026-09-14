import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import handler from '../../api/leads.js';

const originalFetch = globalThis.fetch;
const originalInfo = console.info;
let logs = [];
const originalWebhook = process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL;

const validBody = {
  storeName: 'Loja Fictícia',
  contactName: 'Pessoa de Teste',
  email: 'teste@example.com',
  hasPhysicalStore: 'yes',
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
    'x-vercel-oidc-token': 'test-oidc-token',
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
  logs = [];
  console.info = entry => logs.push(JSON.parse(entry));
  delete process.env.SINTEGRA_CNPJ_API_KEY;
  delete process.env.CRM_CNPJ_BEARER_TOKEN;
  process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL = 'https://webhook.example.test/lead';
});

afterEach(() => {
  console.info = originalInfo;
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
  assert.equal(response.body.error, 'invalid-fields');
  assert.match(response.body.errors.cnpj, /CNPJ inválido/);
  assert.equal(calls, 0);
});

test('envia uma vez ao webhook com enriquecimento normalizado', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('validador-cnpj.vfxaceleradordevendas.com.br')) {
      return new Response(JSON.stringify({
        cnpj: '60887522000189',
        cnpj_valido: true,
        encontrado: true,
        fonte: 'SINTEGRA',
        motivo: '',
        fontes_consultadas: ['SINTEGRA'],
        cnpj_validation_status: 'cadastral_valid',
        company: {
          razao_social: 'Empresa Fictícia Ltda',
          nome_fantasia: 'Loja Fictícia',
          situacao_cadastral: 'ATIVA',
          data_abertura: '02/01/2020',
          endereco: { cidade: 'Itajaí', estado: 'SC' },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    assert.equal(logs[0].msg, 'landing_form_backup');
    assert.deepEqual(logs[0].payload, JSON.parse(options.body));
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const response = createResponse();

  await handler(createRequest(validBody, '192.0.2.2'), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.scoring.lead_score, 100);
  assert.equal(response.body.scoring.qualified, true);
  assert.equal(calls.length, 2);
  assert.equal(calls.filter(({ url }) => url === 'https://webhook.example.test/lead').length, 1);
  const webhookCall = calls.find(({ url }) => url === 'https://webhook.example.test/lead');
  const payload = JSON.parse(webhookCall.options.body);
  assert.equal(payload.cnpj, '60.887.522/0001-89');
  assert.equal(payload.cnpj_digits, '60887522000189');
  assert.equal(payload.cnpj_validation_status, 'cadastral_valid');
  assert.equal(payload.fonte, 'SINTEGRA');
  assert.equal(payload.company.razao_social, 'Empresa Fictícia Ltda');
  assert.equal(payload.source, 'grupo-bilitex-lojista');
  assert.equal(payload.lead_score, payload.value);
  assert.equal(payload.city, 'Itajaí');
  assert.equal(payload.state, 'SC');
  assert.equal(payload.phone, '+5547999999999');
});

test('mantém a entrega checksum-only quando a cascata está indisponível', async () => {
  let webhookPayload;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('validador-cnpj.vfxaceleradordevendas.com.br')) {
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
  assert.equal(webhookPayload.qualification_status, 'pendente');
  assert.equal(webhookPayload.qualified, false);
  assert.equal(webhookPayload.city, '');
  assert.equal(webhookPayload.state, '');
  assert.deepEqual(webhookPayload.fontes_consultadas, []);
});


test('valida todos os campos, opções, telefone e e-mail antes de qualquer consulta', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('não deve consultar'); };
  let index = 30;
  for (const field of ['storeName', 'contactName', 'email', 'whatsapp', 'cnpj', 'instagram', 'brandsSold', 'storeType', 'hasPhysicalStore', 'interestedBrand']) {
    const response = createResponse();
    await handler(createRequest({ ...validBody, [field]: '' }, `192.0.2.${index++}`), response);
    assert.equal(response.statusCode, 400, field);
    assert.ok(response.body.errors[field], field);
  }
  for (const whatsapp of ['00999999999', '11899999999', '119999999999', '119999999', 'abc11999999999']) {
    const response = createResponse();
    await handler(createRequest({ ...validBody, whatsapp }, `192.0.2.${index++}`), response);
    assert.equal(response.statusCode, 400, whatsapp);
  }
  for (const email of ['inválido', 123]) {
    const response = createResponse();
    await handler(createRequest({ ...validBody, email }, `192.0.2.${index++}`), response);
    assert.equal(response.statusCode, 400);
  }
  assert.equal(calls, 0);
});

test('desqualificação aparece no retorno e no backup com os mesmos pontos do webhook', async () => {
  let delivered;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('validador-cnpj.vfxaceleradordevendas.com.br')) {
      return new Response(JSON.stringify({
        cnpj: '60887522000189',
        cnpj_valido: true,
        encontrado: true,
        fonte: 'SINTEGRA',
        motivo: '',
        fontes_consultadas: ['SINTEGRA'],
        cnpj_validation_status: 'cadastral_valid',
        company: {
          razao_social: 'Empresa Teste',
          data_abertura: '01/01/2020',
          endereco: { cidade: 'Itajaí', estado: 'SC' },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    delivered = JSON.parse(options.body);
    assert.deepEqual(logs[0].payload, delivered);
    return new Response('{}', { status: 200 });
  };
  const response = createResponse();
  await handler(createRequest({ ...validBody, storeType: 'online', hasPhysicalStore: 'no' }, '192.0.2.70'), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.scoring.disqualified, true);
  assert.equal(response.body.scoring.disqualification_reasons.length, 2);
  assert.equal(response.body.scoring.lead_score, delivered.lead_score);
  assert.equal(delivered.lead_score, delivered.value);
});
