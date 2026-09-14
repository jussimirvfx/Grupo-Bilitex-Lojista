import { isSameOrigin } from '@jussimirvfx/cnpj-cascade/vercel';
import { recordFormBackup } from './_lib/formBackup.js';

export default async function handler(req, res) {
  if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'origin-not-allowed' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ ok: false, error: 'invalid-json' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ ok: false, error: 'invalid-body' });
  await recordFormBackup(body, req, { source: 'client-log' });
  return res.status(200).json({ ok: true });
}
