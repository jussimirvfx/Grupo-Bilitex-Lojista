import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { lookupCNPJ, normalizeCompany } from '@jussimirvfx/cnpj-cascade';
import { isSameOrigin } from '@jussimirvfx/cnpj-cascade/vercel';
import handler from '../../api/cnpj.js';

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  sintegra: process.env.SINTEGRA_CNPJ_API_KEY,
  crm: process.env.CRM_CNPJ_BEARER_TOKEN,
  landing: process.env.CRM_CNPJ_LANDING_ID,
};

beforeEach(() => {
  delete process.env.SINTEGRA_CNPJ_API_KEY;
  delete process.env.CRM_CNPJ_BEARER_TOKEN;
  process.env.CRM_CNPJ_LANDING_ID = 'grupo-bilitex-lojista';
});

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (originalEnvironment.sintegra === undefined) delete process.env.SINTEGRA_CNPJ_API_KEY;
  else process.env.SINTEGRA_CNPJ_API_KEY = originalEnvironment.sintegra;

  if (originalEnvironment.crm === undefined) delete process.env.CRM_CNPJ_BEARER_TOKEN;
  else process.env.CRM_CNPJ_BEARER_TOKEN = originalEnvironment.crm;

  if (originalEnvironment.landing === undefined) delete process.env.CRM_CNPJ_LANDING_ID;
  else process.env.CRM_CNPJ_LANDING_ID = originalEnvironment.landing;
});

test('não consulta provedores quando o checksum é inválido', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('não deveria consultar');
  };

  const result = await lookupCNPJ('60.887.522/0001-88');

  assert.equal(result.cnpj_valido, false);
  assert.equal(result.cnpj_validation_status, 'invalid');
  assert.equal(calls, 0);
});

test('o endpoint da LP rejeita CNPJ inválido sem consultar provedores', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('não deveria consultar');
  };
  const request = {
    method: 'GET',
    query: { cnpj: '60.887.522/0001-88' },
    headers: {
      host: 'grupo-bilitex-lojista.vercel.app',
      origin: 'https://grupo-bilitex-lojista.vercel.app',
      'sec-fetch-site': 'same-origin',
      'x-forwarded-for': '192.0.2.20',
    },
  };
  const response = {
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
  };

  await handler(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.cnpj_validation_status, 'invalid');
  assert.equal(calls, 0);
});

test('consulta SINTEGRA e para no primeiro registro utilizável', async () => {
  process.env.SINTEGRA_CNPJ_API_KEY = 'test-only';
  process.env.CRM_CNPJ_BEARER_TOKEN = 'test-only';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(JSON.stringify({
      razao_social: 'Empresa Fictícia de Teste Ltda',
      data_abertura: '2020-01-02',
      municipio: 'Itajaí',
      uf: 'SC',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await lookupCNPJ('60887522000189');

  assert.equal(result.fonte, 'SINTEGRA');
  assert.deepEqual(result.fontes_consultadas, ['SINTEGRA']);
  assert.equal(result.company.data_abertura, '02/01/2020');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /sintegrabrasil\.com\.br/);
  assert.equal(calls[0].options.headers['X-Api-Key'], 'test-only');
});

test('normaliza o contrato camelCase do CRM e não chama BrasilAPI após sucesso', async () => {
  process.env.SINTEGRA_CNPJ_API_KEY = 'sintegra-test';
  process.env.CRM_CNPJ_BEARER_TOKEN = 'crm-test';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return new Response('{}', { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      status: 'found',
      company: {
        razaoSocial: 'Empresa Fictícia Ltda',
        nomeFantasia: 'Loja Fictícia',
        situacaoCadastral: 'ATIVA',
        dataInicioAtividade: '2020-01-02',
        porte: 'MICRO EMPRESA',
        cnaePrincipal: 4781400,
        cnaePrincipalDescricao: 'Comércio varejista de artigos do vestuário',
        endereco: {
          completo: 'Rua Teste, nº 100, Centro, Itajaí, SC, 88300-000',
          rua: 'Rua Teste',
          numero: '100',
          bairro: 'Centro',
          cidade: 'Itajaí',
          uf: 'SC',
          cep: '88300-000',
        },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await lookupCNPJ('60887522000189');

  assert.equal(result.fonte, 'CRM');
  assert.deepEqual(result.fontes_consultadas, ['SINTEGRA', 'CRM']);
  assert.equal(result.company.razao_social, 'Empresa Fictícia Ltda');
  assert.equal(result.company.nome_fantasia, 'Loja Fictícia');
  assert.equal(result.company.situacao_cadastral, 'ATIVA');
  assert.equal(result.company.data_abertura, '02/01/2020');
  assert.equal(result.company.tempo_cnpj.length > 0, true);
  assert.equal(result.company.cnae_principal, '4781400');
  assert.equal(result.company.descricao_cnae_principal, 'Comércio varejista de artigos do vestuário');
  assert.equal(result.company.endereco.completo, 'Rua Teste, nº 100, Centro, Itajaí, SC, 88300-000');
  assert.equal(result.company.endereco.rua, 'Rua Teste');
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /landing-lookup/);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer crm-test');
  assert.equal(calls[1].options.headers['x-vfx-landing-id'], 'grupo-bilitex-lojista');
});

test('continua para BrasilAPI quando o CRM traz somente dados parciais sem identidade', async () => {
  process.env.CRM_CNPJ_BEARER_TOKEN = 'crm-test';
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('landing-lookup')) {
      return new Response(JSON.stringify({
        status: 'found',
        company: {
          porte: 'MICRO EMPRESA',
          endereco: { cidade: 'Macaé', uf: 'RJ' },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      razao_social: 'Empresa Completa BrasilAPI Ltda',
      nome_fantasia: 'Empresa Completa',
      descricao_situacao_cadastral: 'ATIVA',
      data_inicio_atividade: '2021-03-04',
      municipio: 'Macaé',
      uf: 'RJ',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await lookupCNPJ('60887522000189');

  assert.equal(result.fonte, 'BrasilAPI');
  assert.deepEqual(result.fontes_consultadas, ['CRM', 'BrasilAPI']);
  assert.equal(result.company.razao_social, 'Empresa Completa BrasilAPI Ltda');
  assert.equal(calls.length, 2);
});

test('usa BrasilAPI como último fallback e normaliza o resultado', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    razao_social: 'Empresa Fictícia BrasilAPI',
    descricao_situacao_cadastral: 'ATIVA',
    data_inicio_atividade: '2021-03-04',
    cnae_fiscal: 4781400,
    cnae_fiscal_descricao: 'Comércio varejista de artigos do vestuário',
    logradouro: 'Rua Teste',
    numero: '100',
    municipio: 'Itajaí',
    uf: 'SC',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const result = await lookupCNPJ('60887522000189');

  assert.equal(result.fonte, 'BrasilAPI');
  assert.equal(result.cnpj_validation_status, 'cadastral_valid');
  assert.equal(result.company.cnae_principal, '4781400');
  assert.equal(result.company.endereco.cidade, 'Itajaí');
  assert.deepEqual(result.fontes_consultadas, ['BrasilAPI']);
});

test('normaliza respostas aninhadas de provedores', () => {
  const company = normalizeCompany({
    company: {
      razao_social: 'Empresa Aninhada',
      data_abertura: '05/06/2022',
      porte: 'ME',
    },
    address: { city: 'Blumenau', state: 'SC' },
  });

  assert.equal(company.razao_social, 'Empresa Aninhada');
  assert.equal(company.data_abertura, '05/06/2022');
  assert.equal(company.porte, 'ME');
  assert.equal(company.endereco.cidade, 'Blumenau');
});

test('aceita somente requisições same-origin', () => {
  assert.equal(isSameOrigin({
    headers: {
      host: 'grupo-bilitex-lojista.vercel.app',
      origin: 'https://grupo-bilitex-lojista.vercel.app',
      'sec-fetch-site': 'same-origin',
    },
  }), true);
  assert.equal(isSameOrigin({
    headers: {
      host: 'grupo-bilitex-lojista.vercel.app',
      origin: 'https://example.com',
      'sec-fetch-site': 'cross-site',
    },
  }), false);
  assert.equal(isSameOrigin({ headers: { host: 'grupo-bilitex-lojista.vercel.app' } }), false);
});
