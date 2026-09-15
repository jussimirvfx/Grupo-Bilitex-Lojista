import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

const enabled = value => value === true || value === 1 || /^(true|1|yes|on)$/i.test(String(value));
const header = (req, key) => String(req.headers?.[key] || '').split(',')[0].trim();
const hash = value => /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase()
  : createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

// Mantém os dados recuperáveis, removendo credenciais inclusive de objetos aninhados.
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .map(([key, item]) => [key, /token|authorization|secret/i.test(key) ? '[REDACTED]' : redact(item)]));
  if (typeof value === 'string' && process.env.META_API_ACCESS_TOKEN) {
    return value.split(process.env.META_API_ACCESS_TOKEN).join('[REDACTED]');
  }
  return value;
}

export function prepareMetaPayload(body, req) {
  const user = {};
  for (const key of ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'external_id']) {
    const values = [body.user_data?.[key]].flat().filter(value => typeof value === 'string' && value.trim());
    if (values.length) user[key] = values.map(hash);
  }
  for (const key of ['fbp', 'fbc']) {
    if (typeof body.user_data?.[key] === 'string') user[key] = body.user_data[key];
  }
  const ip = header(req, 'x-forwarded-for') || req.socket?.remoteAddress;
  if (ip && isIP(ip)) user.client_ip_address = ip;
  if (header(req, 'user-agent')) user.client_user_agent = header(req, 'user-agent');
  const payload = { data: [{
    event_name: body.event_name, event_id: body.event_id,
    event_time: Number.isInteger(body.event_time) ? body.event_time : Math.floor(Date.now() / 1000),
    event_source_url: body.event_source_url, action_source: 'website',
    user_data: user, custom_data: redact(body.custom_data || {}),
  }] };
  const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production';
  if (!production && process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  return payload;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }
  const origin = header(req, 'origin');
  if (origin) {
    try {
      if (new URL(origin).host !== header(req, 'host')) return res.status(403).json({ error: 'origin-not-allowed' });
    } catch { return res.status(403).json({ error: 'origin-not-allowed' }); }
  }
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'invalid-json' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || !['PageView', 'Lead', 'LeadQualificado', 'Scroll'].includes(body.event_name)
    || typeof body.event_id !== 'string' || !body.event_id || body.event_id.length > 200) {
    return res.status(400).json({ error: 'invalid-event' });
  }
  const context = {
    project: process.env.VERCEL_PROJECT_NAME || 'grupo-bilitex-lojista',
    route: '/api/meta/conversions', received_at: new Date().toISOString(),
    request_id: header(req, 'x-vercel-id') || header(req, 'x-request-id') || null,
    event_name: body.event_name, event_id: body.event_id,
  };
  let prepared = null;
  const logError = extra => console.error(JSON.stringify(redact({
    ...context, level: 'error', event: 'conversion_api_event_error',
    msg: 'conversion_api_event_error', request_payload: body, prepared_meta_payload: prepared, ...extra,
  })));
  try {
    prepared = prepareMetaPayload(body, req);
    const dryRun = [header(req, 'x-vfx-dry-run'), body.dry_run, body.dryRun,
      body.vfx_dry_run, body.skip_webhook, process.env.META_DRY_RUN].some(enabled);
    console.info(JSON.stringify(redact({
      ...context, level: 'info', event: 'conversion_api_event_backup', msg: 'conversion_api_event_backup',
      dry_run: dryRun, custom_data: body.custom_data || {},
      user_data_presence: Object.fromEntries(Object.entries(prepared.data[0].user_data).map(([key, value]) => [key, Boolean(value)])),
    })));
    if (dryRun) return res.status(200).json({ accepted: true, dry_run: true, skipped_meta: true });
    if (!process.env.META_PIXEL_ID || !process.env.META_API_ACCESS_TOKEN) throw new Error('meta-not-configured');
    const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(process.env.META_PIXEL_ID)}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.META_API_ACCESS_TOKEN}` },
      body: JSON.stringify(prepared), signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      logError({ meta_status: response.status, meta_error: result });
      return res.status(202).json({ accepted: true, delivered: false });
    }
    return res.status(200).json({ accepted: true, delivered: true, events_received: result.events_received });
  } catch (error) {
    logError({ error_message: error.message });
    return res.status(202).json({ accepted: true, delivered: false });
  }
}
