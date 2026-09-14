import assert from 'node:assert/strict';
import test from 'node:test';
import { recordFormBackup } from '../../api/_lib/formBackup.js';

test('backup preserva payload completo, score zero e modo dry-run antes da entrega', async () => {
  const originalInfo = console.info;
  const events = [];
  console.info = entry => events.push(JSON.parse(entry));
  const payload = { dry_run: true, lead_score: 0, value: 0, qualified: false, disqualification_reasons: ['Loja online'], nested: { retained: true } };
  try {
    await recordFormBackup(payload, { headers: {} });
    events.push({ msg: 'webhook' });
    assert.equal(events[0].msg, 'landing_form_backup');
    assert.equal(events[0].dry_run, true);
    assert.deepEqual(events[0].payload, payload);
    assert.equal(events[0].payload_size, JSON.stringify(payload).length);
    assert.equal(events[1].msg, 'webhook');
  } finally {
    console.info = originalInfo;
  }
});
