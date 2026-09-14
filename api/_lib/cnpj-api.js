const CNPJ_API_URL = 'https://validador-cnpj.vfxaceleradordevendas.com.br/api/v1/cnpj';
const LANDING_ID = 'grupo-bilitex-lojista';
const LOOKUP_TIMEOUT_MS = 12_000;

const header = (request, name) => {
  const value = request.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
};

const oidcToken = (request) => String(
  header(request, 'x-vercel-oidc-token')
  || process.env.VERCEL_OIDC_TOKEN
  || '',
).trim();

export const lookupCNPJViaVFX = async (request, cnpj) => {
  const token = oidcToken(request);
  if (!token || token === '[SENSITIVE]') throw new Error('oidc-unavailable');

  const clientIp = String(header(request, 'x-forwarded-for') || '').split(',')[0].trim();
  const response = await fetch(CNPJ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-VFX-Landing-ID': LANDING_ID,
      ...(clientIp ? { 'X-VFX-Client-IP': clientIp } : {}),
    },
    body: JSON.stringify({ cnpj }),
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result || result.cnpj_valido !== true) {
    throw new Error('cnpj-api-unavailable');
  }

  return result;
};
