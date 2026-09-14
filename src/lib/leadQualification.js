export const storeOptions = [
  { value: 'boutique', label: 'Boutique', points: 40, disqualifies: false },
  { value: 'multimarcas', label: 'Multimarcas', points: 40, disqualifies: false },
  { value: 'shopping', label: 'Loja de shopping', points: 5, disqualifies: false },
  { value: 'online', label: 'Loja online', points: 10, disqualifies: true },
  { value: 'autonomo', label: 'Revendedor(a) autônomo(a)', points: 1, disqualifies: true },
  { value: 'magazine', label: 'Magazine', points: 5, disqualifies: true },
];
export const physicalStoreOptions = [
  { value: 'yes', label: 'Sim', points: 34, disqualifies: false },
  { value: 'no', label: 'Não', points: 5, disqualifies: true },
];
export const ageOptions = [
  { value: 'menos-de-1-ano', label: 'Menos de 1 ano', points: 10, disqualifies: true },
  { value: 'de-1-a-2-anos', label: 'De 1 a 2 anos', points: 15, disqualifies: false },
  { value: 'de-3-a-4-anos', label: 'De 3  a 4 anos', points: 20, disqualifies: false },
  { value: 'mais-de-5-anos', label: 'Mais de 5 anos', points: 25, disqualifies: false },
];
const states = 'SP RJ MG RS PR SC GO DF BA PE CE ES MT MS PB RN AL SE PI MA TO PA AM RO AC RR AP'.split(' ');
export const brandOptions = ['Bakulelê', 'Biliton', 'As duas marcas'];

export function companyAge(openingDate, now = new Date()) {
  const raw = String(openingDate || '');
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const iso = parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : raw;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso || date > now) return null;
  let years = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) years--;
  return years;
}

export function qualifyLead(data, company = {}, now = new Date()) {
  const city = String(company.endereco?.cidade || '').trim();
  const state = String(company.endereco?.estado || company.endereco?.uf || '').trim().toUpperCase();
  const years = companyAge(company.data_abertura, now);
  // Faixas em anos completos: <1, 1–2, 3–4 e 5+, sem lacuna no quinto ano.
  const age = years === null ? null : ageOptions[years < 1 ? 0 : years < 3 ? 1 : years < 5 ? 2 : 3];
  const store = storeOptions.find(option => option.value === data.storeType || option.label === data.storeType);
  const physical = physicalStoreOptions.find(option => option.value === data.hasPhysicalStore);
  const details = [
    { field: 'storeType', question: 'Qual o tipo da loja?', ...store },
    { field: 'hasPhysicalStore', question: 'Possui loja física?', ...physical },
    { field: 'tempoCnpj', question: 'Tempo de CNPJ', ...(age || { value: null, label: 'Indisponível', points: 0, disqualifies: false }) },
    { field: 'state', question: 'Em qual estado está localizado?', value: state || null, label: state || 'Indisponível', points: states.includes(state) ? 1 : 0, disqualifies: false },
  ];
  const reasons = details.filter(item => item.disqualifies).map(item => `${item.question} ${item.label}`);
  const pending = [];
  if (!city) pending.push('Cidade não retornada pela consulta do CNPJ.');
  if (!states.includes(state)) pending.push('Estado não retornado ou inválido na consulta do CNPJ.');
  if (years === null) pending.push('Data de abertura não retornada ou inválida na consulta do CNPJ.');
  const score = details.reduce((sum, item) => sum + (item.points ?? 0), 0);
  const status = reasons.length ? 'desqualificado' : pending.length ? 'pendente' : 'qualificado';
  return { city, state, tempoCnpj: age?.value ?? null, cnpj_age_years: years, data_abertura: company.data_abertura || null, lead_score: score, value: score, currency: 'BRL', lead_score_details: details, qualification_status: status, qualified: status === 'qualificado', disqualified: status === 'desqualificado', disqualification_reasons: reasons, qualification_pending_reasons: pending, score_complete: pending.length === 0 };
}
