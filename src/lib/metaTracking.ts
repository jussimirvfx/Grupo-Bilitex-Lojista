import type { RegisterFormData } from '../types';

type Scoring = { city: string; state: string; value: number; currency: string; lead_score: number; qualified: boolean };
type Tracker = { trackLead: (data: Record<string, unknown>) => Promise<unknown>; trackLeadQualificado: (data: Record<string, unknown>) => Promise<unknown> };

export async function trackAcceptedLead(form: RegisterFormData, scoring: Scoring, tracker: Tracker) {
  const leadData = {
    name: form.contactName.trim(), email: form.email.trim(),
    phone: `55${form.whatsapp.replace(/\D/g, '')}`,
    city: scoring.city, state: scoring.state, country: 'BR',
    value: scoring.value, currency: scoring.currency, lead_score: scoring.lead_score,
    content_name: 'Formulário de Contato', content_category: 'Lead Generation',
  };
  // Falhas de analytics não transformam um cadastro já entregue em erro no formulário.
  for (const send of [tracker.trackLead, ...(scoring.qualified === true ? [tracker.trackLeadQualificado] : [])]) {
    try { await send(leadData); }
    catch { console.warn('Não foi possível concluir o tracking do cadastro.'); }
  }
}
