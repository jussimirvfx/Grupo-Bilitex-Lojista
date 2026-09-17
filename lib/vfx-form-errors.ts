/** Messages only: callers retain their existing eligibility and fallback rules. */
export function getCnpjErrorMessage(result: unknown, fallback = 'Não foi possível consultar o CNPJ agora. Tente novamente em instantes.'): string {
  const root = result && typeof result === 'object' ? result as Record<string, any> : {};
  const company = root.company || root.central_company || root.empresa || root.data?.company || root;
  const clean = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const situation = clean(company.situacaoCadastral ?? company.situacao_cadastral ?? company.descricao_situacao_cadastral ?? company.descricaoSituacaoCadastral ?? root.registration_status);
  const statuses: Record<string, string> = { '1': 'NULO', '01': 'NULO', NULA: 'NULO', NULO: 'NULO', '3': 'SUSPENSO', '03': 'SUSPENSO', SUSPENSA: 'SUSPENSO', SUSPENSO: 'SUSPENSO', '4': 'INAPTO', '04': 'INAPTO', INAPTA: 'INAPTO', INAPTO: 'INAPTO', '8': 'BAIXADO', '08': 'BAIXADO', BAIXADA: 'BAIXADO', BAIXADO: 'BAIXADO', INATIVA: 'INATIVO', INATIVO: 'INATIVO' };
  const code = clean(root.code || root.error_code || root.reason || root.error || root.status).replace(/[ -]+/g, '_');
  const inactiveCodes = /^(INACTIVE|CNPJ_INACTIVE|INACTIVE_CNPJ|CNPJ_NOT_ACTIVE|COMPANY_INACTIVE|REGISTRATION_INACTIVE|CNPJ_BAIXADO|CNPJ_BAIXADA|CNPJ_INATIVO|CNPJ_INATIVA)$/;
  const temporary = /^(VALIDATION_UNAVAILABLE|LOOKUP_UNAVAILABLE|RATE_LIMITED|UPSTREAM_ERROR|TIMEOUT|CNPJ_LOOKUP_FAILED|SERVICE_UNAVAILABLE)$/;
  // Do not infer inactivity from an HTTP status or an unavailable lookup.
  if (temporary.test(code)) return fallback;
  const inactive = statuses[situation] || (inactiveCodes.test(code) || company.ativa === false || company.active === false ? 'INATIVO' : '');
  if (inactive) return `O CNPJ informado está ${inactive}. Informe um CNPJ ativo e válido para continuarmos.`;
  if (/^(INVALID_CNPJ|CNPJ_INVALID|INVALID_INPUT|CNPJ_INVALIDO|INVALID)$/.test(code)) return 'O CNPJ informado é inválido. Confira os 14 dígitos e informe um CNPJ válido para continuarmos.';
  if (/^(NOT_FOUND|CNPJ_NOT_FOUND|COMPANY_NOT_FOUND|CNPJ_NAO_ENCONTRADO)$/.test(code)) return 'Não encontramos o CNPJ informado. Confira o número e informe um CNPJ ativo e válido para continuarmos.';
  return fallback;
}

export const FORM_BACKUP_ERROR_MESSAGE = 'Não foi possível registrar seu cadastro agora. Suas respostas foram mantidas no formulário. Tente enviar novamente em instantes.';
export const FORM_DELIVERY_ERROR_MESSAGE = 'Não foi possível concluir o envio agora. Suas respostas foram mantidas no formulário. Tente enviar novamente em instantes.';

export class FormSubmissionError extends Error {
  readonly userMessage: string;
  constructor(message: string) { super(message); this.name = 'FormSubmissionError'; this.userMessage = message; }
}

export function getFormErrorMessage(error: unknown, fallback = FORM_DELIVERY_ERROR_MESSAGE): string {
  return error instanceof FormSubmissionError ? error.userMessage : fallback;
}

export async function createFormResponseError(response: Response, parsed?: unknown): Promise<FormSubmissionError> {
  let body = parsed && typeof parsed === 'object' ? parsed as Record<string, any> : undefined;
  if (!body) body = await response.clone().json().catch(() => ({}));
  const code = String(body?.code || body?.error || body?.status || '').toLowerCase().replace(/[- ]/g, '_');
  if (/^(backup_unconfirmed|backup_failed|backup_not_recorded|form_intake_failed)$/.test(code)) return new FormSubmissionError(FORM_BACKUP_ERROR_MESSAGE);
  if (/^(invalid_form|invalid_lead|missing_fields|invalid_payload)$/.test(code)) return new FormSubmissionError('Confira os campos obrigatórios e os dados informados antes de enviar novamente.');
  const cnpjCodes = /^(inactive|cnpj_inactive|inactive_cnpj|cnpj_not_active|invalid_cnpj|cnpj_invalid|invalid|not_found|cnpj_not_found|company_not_found)$/;
  if (cnpjCodes.test(code)) return new FormSubmissionError(getCnpjErrorMessage({ ...body, code }));
  if (/^(cnpj_unavailable|cnpj_incomplete|cnpj_lookup_failed|validation_unavailable)$/.test(code)) return new FormSubmissionError('Não foi possível confirmar os dados cadastrais do CNPJ agora. Tente novamente em instantes.');
  return new FormSubmissionError(FORM_DELIVERY_ERROR_MESSAGE);
}
