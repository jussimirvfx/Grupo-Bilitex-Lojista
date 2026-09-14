import assert from 'node:assert/strict';
import test from 'node:test';
import { qualifyLead, companyAge, storeOptions } from '../../src/lib/leadQualification.js';

const now = new Date('2026-09-14T12:00:00Z');
const data = { storeType: 'multimarcas', hasPhysicalStore: 'yes' };
const company = { data_abertura: '14/09/2020', endereco: { cidade: 'Itajaí', uf: 'SC' } };

test('máximo 100, soma auditável e campos básicos sem pontos', () => {
  const score = qualifyLead(data, company, now);
  assert.equal(score.lead_score, 100);
  assert.equal(score.value, 100);
  assert.equal(score.qualified, true);
  assert.equal(score.lead_score_details.reduce((sum, item) => sum + item.points, 0), 100);
  assert.deepEqual(score.lead_score_details.map(item => item.points), [40, 34, 25, 1]);
  assert.deepEqual(qualifyLead({ ...data, contactName: 'Outro', email: 'x@example.com', whatsapp: '11999999999', instagram: '@x', interestedBrand: 'Biliton', city: 'Falsa', state: 'XX', tempoCnpj: 'menos-de-1-ano', lead_score: 0 }, company, now), score);
});

test('todas as opções respeitam pontos e desqualificadores da tabela', () => {
  for (const option of storeOptions) {
    const score = qualifyLead({ ...data, storeType: option.value }, company, now);
    assert.equal(score.lead_score, option.points + 60);
    assert.equal(score.disqualified, option.disqualifies);
    assert.equal(score.disqualification_reasons.length, option.disqualifies ? 1 : 0);
  }
});

test('loja sem espaço físico e CNPJ novo acumulam todos os motivos', () => {
  const score = qualifyLead({ storeType: 'online', hasPhysicalStore: 'no' }, { ...company, data_abertura: '01/01/2026' }, now);
  assert.equal(score.lead_score, 26);
  assert.equal(score.qualification_status, 'desqualificado');
  assert.equal(score.disqualification_reasons.length, 3);
  assert.equal(score.qualified, false);
});

test('limites das faixas usam aniversários completos', () => {
  for (const [date, years, points] of [
    ['15/09/2025', 0, 10], ['14/09/2025', 1, 15], ['15/09/2023', 2, 15],
    ['14/09/2023', 3, 20], ['15/09/2021', 4, 20], ['14/09/2021', 5, 25],
  ]) {
    assert.equal(companyAge(date, now), years);
    assert.equal(qualifyLead(data, { ...company, data_abertura: date }, now).lead_score_details[2].points, points);
  }
});

test('dados indisponíveis ficam pendentes e não usam localização enviada pelo navegador', () => {
  const score = qualifyLead({ ...data, state: 'SP', city: 'São Paulo' }, {}, now);
  assert.equal(score.lead_score, 74);
  assert.equal(score.qualified, false);
  assert.equal(score.disqualified, false);
  assert.equal(score.qualification_status, 'pendente');
  assert.equal(score.qualification_pending_reasons.length, 3);
  assert.equal(score.city, '');
});

test('falha de consulta não elimina uma desqualificação já conhecida', () => {
  const score = qualifyLead({ ...data, hasPhysicalStore: 'no' }, {}, now);
  assert.equal(score.disqualified, true);
  assert.equal(score.score_complete, false);
});

test('datas inválidas ou futuras não geram idade e nenhum ponto', () => {
  for (const date of ['', '31/02/2020', '00/01/2020', '2020-13-01', '15/09/2026', 'inválida']) {
    assert.equal(companyAge(date, now), null);
    assert.equal(qualifyLead(data, { ...company, data_abertura: date }, now).lead_score_details[2].points, 0);
  }
});
