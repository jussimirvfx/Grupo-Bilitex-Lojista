import test from 'node:test';
import assert from 'node:assert/strict';
import { isCurationBlocked } from '../../src/lib/leadQualification.js';

test('curadoria aplica somente critérios solicitados e libera no primeiro aniversário', () => {
  const now = new Date('2026-09-15T12:00:00Z');
  assert.equal(isCurationBlocked({ storeType: 'multimarcas' }, { data_abertura: '2025-09-16' }, now), true);
  assert.equal(isCurationBlocked({ storeType: 'multimarcas' }, { data_abertura: '2025-09-15' }, now), false);
  assert.equal(isCurationBlocked({ storeType: 'online', hasPhysicalStore: 'no' }, { data_abertura: '2020-01-01' }, now), false);
  assert.equal(isCurationBlocked({ storeType: 'multimarcas' }, {}, now), false);
});
