import {
  formatCNPJ,
  isValidCNPJ,
  lookupCNPJ,
  normalizeCNPJ,
} from '@jussimirvfx/cnpj-cascade';
import { isSameOrigin } from '@jussimirvfx/cnpj-cascade/vercel';

const WEBHOOK_TIMEOUT_MS = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

const formatWhatsApp = (value) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body !== 'string') return body;

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const getHeader = (req, name) => {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
};

const rateLimitStore = globalThis.__grupoBilitexLeadRateLimit
  || (globalThis.__grupoBilitexLeadRateLimit = new Map());

const isRateLimited = (req) => {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  const ip = String(forwardedFor || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
};

export const buildLeadPayload = (body, cnpjLookup) => {
  const company = cnpjLookup.company || {};
  const hasCompleteCNPJData = cnpjLookup.cnpj_valido === true
    && cnpjLookup.encontrado === true
    && Boolean(cnpjLookup.fonte)
    && Boolean(company.razao_social || company.nome_fantasia);

  return {
    storeName: String(body.storeName).trim(),
    contactName: String(body.contactName).trim(),
    whatsapp: formatWhatsApp(body.whatsapp),
    cnpj: formatCNPJ(body.cnpj),
    cnpj_digits: normalizeCNPJ(body.cnpj),
    cnpj_validation_status: hasCompleteCNPJData ? 'cadastral_valid' : 'checksum_valid',
    encontrado: cnpjLookup.encontrado === true,
    fonte: String(cnpjLookup.fonte || '').slice(0, 30),
    motivo: String(cnpjLookup.motivo || '').slice(0, 200),
    fontes_consultadas: Array.isArray(cnpjLookup.fontes_consultadas)
      ? cnpjLookup.fontes_consultadas
      : [],
    company,
    city: String(body.city).trim(),
    state: String(body.state).trim(),
    instagram: String(body.instagram || '').trim(),
    brandsSold: String(body.brandsSold || '').trim(),
    storeType: String(body.storeType).trim(),
    interestedBrand: String(body.interestedBrand).trim(),
    submittedAt: typeof body.submittedAt === 'string' ? body.submittedAt : new Date().toISOString(),
    source: 'grupo-bilitex-lojista',
    url: typeof body.url === 'string' ? body.url : '',
  };
};

export default async function handler(req, res) {
  if (!isSameOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'origin-not-allowed' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }
  if (isRateLimited(req)) {
    return res.status(429).json({ ok: false, error: 'rate-limited' });
  }

  const body = parseBody(req.body);
  const requiredFields = [
    'storeName',
    'contactName',
    'whatsapp',
    'cnpj',
    'city',
    'state',
    'storeType',
    'interestedBrand',
  ];
  const hasRequiredFields = requiredFields.every((field) => String(body[field] || '').trim());
  const whatsappDigits = onlyDigits(body.whatsapp);

  if (!hasRequiredFields) {
    return res.status(400).json({ ok: false, error: 'missing-required-fields' });
  }
  if (!isValidCNPJ(body.cnpj)) {
    return res.status(400).json({ ok: false, error: 'invalid-cnpj' });
  }
  if (whatsappDigits.length !== 10 && whatsappDigits.length !== 11) {
    return res.status(400).json({ ok: false, error: 'invalid-whatsapp' });
  }

  const webhookURL = process.env.N8N_GRUPO_BILITEX_WEBHOOK_URL;
  if (!webhookURL) {
    return res.status(503).json({ ok: false, error: 'lead-service-unavailable' });
  }

  // The server repeats the lookup so downstream data never trusts browser state.
  const cnpjLookup = await lookupCNPJ(body.cnpj);
  const payload = buildLeadPayload(body, cnpjLookup);

  try {
    const webhookResponse = await fetch(webhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!webhookResponse.ok) {
      return res.status(502).json({ ok: false, error: 'lead-service-unavailable' });
    }
  } catch {
    return res.status(502).json({ ok: false, error: 'lead-service-unavailable' });
  }

  return res.status(200).json({ ok: true });
}
