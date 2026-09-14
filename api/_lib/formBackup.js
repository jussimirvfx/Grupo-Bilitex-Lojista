export async function recordFormBackup(payload, req, context = {}) {
  console.info(JSON.stringify({
    level: 'info', msg: 'landing_form_backup', event: 'form-submit',
    project: process.env.VERCEL_PROJECT_NAME || 'grupo-bilitex', route: '/api/form-log',
    dry_run: Boolean(payload.dry_run), received_at: new Date().toISOString(),
    vercel_deployment: process.env.VERCEL_URL || null,
    user_agent: req.headers?.['user-agent'] || null,
    forwarded_for: req.headers?.['x-forwarded-for'] || null,
    payload_size: JSON.stringify(payload).length, context, payload,
  }));
}
