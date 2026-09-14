import React, { useState, useEffect, useRef } from 'react';
import { FORM_CONTENT, BRAZILIAN_STATES } from '../data/content';
import { RegisterFormData, StoreType, BrandInterest } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  formatCNPJ,
  isValidCNPJ,
  normalizeCNPJ,
} from '@jussimirvfx/cnpj-cascade/browser';

interface RegisterFormProps {
  selectedBrandPreference?: BrandInterest;
}

interface CNPJLookupResult {
  cnpj: string;
  cnpj_valido: boolean;
  encontrado: boolean;
  fonte: string;
  motivo: string;
  fontes_consultadas: string[];
  cnpj_validation_status: 'cadastral_valid' | 'checksum_valid';
  company: Record<string, unknown>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ selectedBrandPreference }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    storeName: '',
    contactName: '',
    whatsapp: '',
    cnpj: '',
    city: '',
    state: 'SP',
    instagram: '',
    brandsSold: '',
    storeType: 'Multimarcas',
    interestedBrand: selectedBrandPreference || 'As duas marcas',
    agreedTerms: false
  });

  useEffect(() => {
    if (selectedBrandPreference) {
      setFormData(prev => ({ ...prev, interestedBrand: selectedBrandPreference }));
    }
  }, [selectedBrandPreference]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const cnpjLookupController = useRef<AbortController | null>(null);
  const activeCNPJLookup = useRef('');
  const cnpjLookup = useRef<CNPJLookupResult | null>(null);

  useEffect(() => () => cnpjLookupController.current?.abort(), []);

  const lookupCNPJ = async (digits: string) => {
    if (
      activeCNPJLookup.current === digits
      || cnpjLookup.current?.cnpj === digits
    ) return;

    cnpjLookupController.current?.abort();
    const controller = new AbortController();
    cnpjLookupController.current = controller;
    activeCNPJLookup.current = digits;

    try {
      const response = await fetch(`/api/cnpj?cnpj=${encodeURIComponent(digits)}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as CNPJLookupResult | null;

      if (
        !controller.signal.aborted
        && response.ok
        && result?.cnpj === digits
        && result.cnpj_valido === true
      ) {
        cnpjLookup.current = result;
      }
    } catch {
      // A consulta cadastral é silenciosa e opcional. O checksum local continua válido.
    } finally {
      if (activeCNPJLookup.current === digits) activeCNPJLookup.current = '';
    }
  };

  const maskWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'cnpj') {
      const cnpj = formatCNPJ(value);
      const digits = normalizeCNPJ(cnpj);
      const validChecksum = digits.length === 14 && isValidCNPJ(digits);

      cnpjLookupController.current?.abort();
      activeCNPJLookup.current = '';
      if (cnpjLookup.current?.cnpj !== digits) cnpjLookup.current = null;

      setFormData(prev => ({ ...prev, cnpj }));
      setErrors(prev => ({
        ...prev,
        cnpj: digits.length === 14 && !validChecksum
          ? 'CNPJ inválido. Confira os números informados.'
          : '',
      }));
      return;
    } else if (name === 'whatsapp') {
      setFormData(prev => ({ ...prev, whatsapp: maskWhatsApp(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCNPJBlur = () => {
    const digits = normalizeCNPJ(formData.cnpj);

    if (digits.length > 0 && digits.length < 14) {
      setErrors(prev => ({ ...prev, cnpj: 'Informe os 14 números do CNPJ.' }));
      return;
    }

    if (digits.length === 14 && !isValidCNPJ(digits)) {
      setErrors(prev => ({
        ...prev,
        cnpj: 'CNPJ inválido. Confira os números informados.',
      }));
      return;
    }

    if (digits.length === 14) {
      setErrors(prev => ({ ...prev, cnpj: '' }));
      void lookupCNPJ(digits);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeName.trim()) newErrors.storeName = 'Informe o nome da loja';
    if (!formData.contactName.trim()) newErrors.contactName = 'Informe o nome do responsável';
    
    const whatsappDigits = formData.whatsapp.replace(/\D/g, '');
    if (!whatsappDigits || whatsappDigits.length < 10) {
      newErrors.whatsapp = 'Informe um WhatsApp válido com DDD';
    }

    const cnpjDigits = normalizeCNPJ(formData.cnpj);
    if (cnpjDigits.length !== 14) {
      newErrors.cnpj = 'Informe os 14 números do CNPJ.';
    } else if (!isValidCNPJ(cnpjDigits)) {
      newErrors.cnpj = 'CNPJ inválido. Confira os números informados.';
    }

    if (!formData.city.trim()) newErrors.city = 'Informe a cidade';
    if (!formData.state) newErrors.state = 'Selecione o estado';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cnpj: formatCNPJ(formData.cnpj),
          cnpj_digits: normalizeCNPJ(formData.cnpj),
          cnpj_validation_status: 'checksum_valid',
          submittedAt: new Date().toISOString(),
          source: 'grupo-bilitex-lojista',
          url: window.location.href,
        }),
      });

      if (!response.ok) throw new Error('lead-service-unavailable');

      cnpjLookupController.current?.abort();
      setSubmitted(true);
      setErrors({});
    } catch {
      setErrors(prev => ({
        ...prev,
        submit: 'Não foi possível enviar sua solicitação. Tente novamente em instantes.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const storeTypes: StoreType[] = [
    'Boutique',
    'Multimarcas',
    'Loja de shopping',
    'Loja online',
    'Outro'
  ];

  const brandOptions: BrandInterest[] = [
    'Bakulelê',
    'Biliton',
    'As duas marcas'
  ];

  return (
    <section
      id="cadastro"
      className="relative py-16 sm:py-24 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `url('https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/bilitex-ind-1787832304804.webp')`
      }}
    >
      {/* Light Black Overlay */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 z-10">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FBE64E] tracking-tight">
            {FORM_CONTENT.title}
          </h2>
        </motion.div>

        {/* Clean Deeply Blurred Form Card (No borders) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
          className="bg-white/80 backdrop-blur-2xl p-6 sm:p-10 text-left shadow-2xl"
        >
          
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="py-12 text-center space-y-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white"
                >
                  <CheckCircle2 size={36} />
                </motion.div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl font-bold text-black">
                    Solicitação Enviada com Sucesso!
                  </h3>
                  <p className="text-base text-black/80">
                    {FORM_CONTENT.successMessage}
                  </p>
                </div>
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        storeName: '',
                        contactName: '',
                        whatsapp: '',
                        cnpj: '',
                        city: '',
                        state: 'SP',
                        instagram: '',
                        brandsSold: '',
                        storeType: 'Multimarcas',
                        interestedBrand: 'As duas marcas',
                        agreedTerms: false
                      });
                    }}
                    className="inline-flex items-center justify-center bg-black text-white hover:bg-[#B1AEA7] hover:text-black transition-colors text-xs font-semibold px-6 py-3 cursor-pointer focus:outline-none"
                  >
                    Enviar novo cadastro
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6" 
                noValidate
              >
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Nome da loja */}
                  <div className="space-y-1.5">
                    <label htmlFor="storeName" className="block text-xs font-bold uppercase tracking-wider text-black">
                      Nome da Loja *
                    </label>
                    <input
                      type="text"
                      id="storeName"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Ex: Boutique Infantil & Teen"
                      className={`w-full bg-[#B1AEA7]/10 ${
                        errors.storeName ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none`}
                    />
                    {errors.storeName && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.storeName}
                      </p>
                    )}
                  </div>

                  {/* Nome do responsável */}
                  <div className="space-y-1.5">
                    <label htmlFor="contactName" className="block text-xs font-bold uppercase tracking-wider text-black">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      className={`w-full bg-[#B1AEA7]/10 ${
                        errors.contactName ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none`}
                    />
                    {errors.contactName && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.contactName}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label htmlFor="whatsapp" className="block text-xs font-bold uppercase tracking-wider text-black">
                      WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="(00) 90000-0000"
                      className={`w-full bg-[#B1AEA7]/10 ${
                        errors.whatsapp ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none`}
                    />
                    {errors.whatsapp && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.whatsapp}
                      </p>
                    )}
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-1.5">
                    <label htmlFor="cnpj" className="block text-xs font-bold uppercase tracking-wider text-black">
                      CNPJ da Loja *
                    </label>
                    <input
                      type="text"
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      onBlur={handleCNPJBlur}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={18}
                      aria-invalid={Boolean(errors.cnpj)}
                      aria-describedby={errors.cnpj ? 'cnpj-error' : undefined}
                      placeholder="00.000.000/0000-00"
                      className={`w-full bg-[#B1AEA7]/10 ${
                        errors.cnpj ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none`}
                    />
                    {errors.cnpj && (
                      <p id="cnpj-error" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.cnpj}
                      </p>
                    )}
                  </div>

                  {/* Cidade */}
                  <div className="space-y-1.5">
                    <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-black">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Sua cidade"
                      className={`w-full bg-[#B1AEA7]/10 ${
                        errors.city ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.city}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="space-y-1.5">
                    <label htmlFor="state" className="block text-xs font-bold uppercase tracking-wider text-black">
                      Estado (UF) *
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-[#B1AEA7]/10 p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors cursor-pointer rounded-none"
                    >
                      {BRAZILIAN_STATES.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  {/* Instagram da loja */}
                  <div className="space-y-1.5">
                    <label htmlFor="instagram" className="block text-xs font-bold uppercase tracking-wider text-black">
                      Instagram da Loja
                    </label>
                    <input
                      type="text"
                      id="instagram"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="@sualoja"
                      className="w-full bg-[#B1AEA7]/10 p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none"
                    />
                  </div>

                  {/* Principais marcas já vendidas */}
                  <div className="space-y-1.5">
                    <label htmlFor="brandsSold" className="block text-xs font-bold uppercase tracking-wider text-black">
                      Principais Marcas que Já Vende
                    </label>
                    <input
                      type="text"
                      id="brandsSold"
                      name="brandsSold"
                      value={formData.brandsSold}
                      onChange={handleChange}
                      placeholder="Ex: Marca A, Marca B..."
                      className="w-full bg-[#B1AEA7]/10 p-3.5 sm:p-3 text-base sm:text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-colors rounded-none"
                    />
                  </div>

                </div>

                {/* Tipo de loja */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black">
                    Tipo de Loja *
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {storeTypes.map((type) => (
                      <motion.button
                        type="button"
                        key={type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFormData(prev => ({ ...prev, storeType: type }))}
                        className={`text-xs sm:text-sm font-semibold px-4 py-3 sm:py-2.5 transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                          formData.storeType === type
                            ? 'bg-black text-white shadow-xs'
                            : 'bg-[#B1AEA7]/20 text-black hover:bg-[#B1AEA7]/40'
                        }`}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Marca de interesse */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black">
                    Marca de Interesse Principal *
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {brandOptions.map((brand) => (
                      <motion.button
                        type="button"
                        key={brand}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFormData(prev => ({ ...prev, interestedBrand: brand }))}
                        className={`text-xs sm:text-sm font-semibold px-4 py-3 sm:py-2.5 transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                          formData.interestedBrand === brand
                            ? 'bg-black text-white shadow-xs'
                            : 'bg-[#B1AEA7]/20 text-black hover:bg-[#B1AEA7]/40'
                        }`}
                      >
                        {brand}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.03, backgroundColor: '#333333' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white transition-all text-sm font-bold px-10 py-4 uppercase tracking-wider cursor-pointer focus:outline-none disabled:opacity-50 shadow-md"
                  >
                    {loading ? 'Processando envio...' : 'Quero ser lojista parceiro'}
                  </motion.button>
                  {errors.submit && (
                    <p role="alert" className="mt-3 text-sm text-red-600">
                      {errors.submit}
                    </p>
                  )}
                </div>

              </motion.form>
            )}
          </AnimatePresence>

        </motion.div>

      </div>
    </section>
  );
};
