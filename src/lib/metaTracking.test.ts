import test from 'node:test';
import assert from 'node:assert/strict';
import { trackAcceptedLead } from './metaTracking';
import type { RegisterFormData } from '../types';

const form = { contactName: 'Pessoa Teste', email: 'teste@example.com', whatsapp: '(47) 99999-9999' } as RegisterFormData;
for (const qualified of [true, false]) {
  test(`envia Lead e respeita qualified=${qualified}, preservando score zero`, async () => {
    const events: string[] = [];
    const tracker = {
      trackLead: async data => { events.push('Lead'); assert.equal(data.lead_score, 0); assert.equal(data.phone, '5547999999999'); },
      trackLeadQualificado: async () => { events.push('LeadQualificado'); },
    };
    await trackAcceptedLead(form, { city: '', state: '', lead_score: 0, value: 0, currency: 'BRL', qualified }, tracker);
    assert.deepEqual(events, qualified ? ['Lead', 'LeadQualificado'] : ['Lead']);
  });
}
test('falha de tracking não rejeita cadastro nem impede próximo evento', async () => {
  const originalWarn = console.warn; console.warn = () => {};
  let sent = false;
  try {
    await trackAcceptedLead(form, { city: '', state: '', lead_score: 100, value: 100, currency: 'BRL', qualified: true }, {
      trackLead: async () => { throw Error('network'); }, trackLeadQualificado: async () => { sent = true; },
    });
    assert.equal(sent, true);
  } finally { console.warn = originalWarn; }
});
