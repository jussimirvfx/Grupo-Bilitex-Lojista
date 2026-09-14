import { isValidCNPJ } from '@jussimirvfx/cnpj-cascade/browser';
import { storeOptions, physicalStoreOptions, brandOptions } from './leadQualification.js';

const ddds = '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' ');

export function validateLead(data) {
  /** @type {Record<string, string>} */
  const errors = {};
  data = data && typeof data === 'object' ? data : {};
  for (const [field, label] of Object.entries({ storeName: 'o nome da loja', contactName: 'o nome do responsável', email: 'o e-mail', whatsapp: 'o telefone com DDD', cnpj: 'o CNPJ', instagram: 'o Instagram da loja', brandsSold: 'as marcas que já vende' })) {
    if (typeof data[field] !== 'string' || !data[field].trim()) errors[field] = `Informe ${label}.`;
  }
  if (typeof data.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Informe um e-mail válido.';
  const phone = String(data.whatsapp || '').replace(/\D/g, '');
  if (!/^[\d()\s-]+$/.test(data.whatsapp || '') || !/^\d{10,11}$/.test(phone)) errors.whatsapp = 'Informe o DDD e um telefone com 8 ou 9 números.';
  else if (!ddds.includes(phone.slice(0, 2))) errors.whatsapp = 'Informe um DDD brasileiro válido.';
  else if (phone.length === 11 && phone[2] !== '9') errors.whatsapp = 'O celular deve começar com 9 após o DDD.';
  const cnpj = String(data.cnpj || '').replace(/\D/g, '');
  if (!/^[\d.\/-]+$/.test(data.cnpj || '') || cnpj.length !== 14) errors.cnpj = 'Informe os 14 números do CNPJ.';
  else if (!isValidCNPJ(cnpj)) errors.cnpj = 'CNPJ inválido. Confira os números informados.';
  if (!storeOptions.some(option => option.value === data.storeType || option.label === data.storeType)) errors.storeType = 'Selecione o tipo da loja.';
  if (!physicalStoreOptions.some(option => option.value === data.hasPhysicalStore)) errors.hasPhysicalStore = 'Informe se possui loja física.';
  if (!brandOptions.includes(data.interestedBrand)) errors.interestedBrand = 'Selecione a marca de interesse.';
  return errors;
}

