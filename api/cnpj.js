import {
  isValidCNPJ,
  normalizeCNPJ,
} from '@jussimirvfx/cnpj-cascade/browser';
import { isSameOrigin } from '@jussimirvfx/cnpj-cascade/vercel';
import { lookupCNPJViaVFX } from './_lib/cnpj-api.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isSameOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'origin-not-allowed' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  const cnpj = normalizeCNPJ(req.query?.cnpj);
  if (!isValidCNPJ(cnpj)) {
    return res.status(400).json({
      cnpj,
      cnpj_valido: false,
      encontrado: false,
      fonte: '',
      motivo: 'invalid-cnpj',
      fontes_consultadas: [],
      cnpj_validation_status: 'invalid',
      company: {},
    });
  }

  try {
    return res.status(200).json(await lookupCNPJViaVFX(req, cnpj));
  } catch {
    return res.status(503).json({ ok: false, error: 'lookup-unavailable' });
  }
}
