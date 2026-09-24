import React, { useState, useRef } from 'react';
import { FORM_CONTENT } from '../data/content';
import { RegisterFormData } from '../types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  formatCNPJ,
  isValidCNPJ,
  normalizeCNPJ,
} from '@jussimirvfx/cnpj-cascade/browser';

import { storeOptions, physicalStoreOptions, brandOptions, qualifyLead, isCurationBlocked } from '../lib/leadQualification.js';

import { validateLead } from '../lib/leadValidation.js';
import { useMetaPixel } from 'scoretrack';
import { trackAcceptedLead } from '../lib/metaTracking';
import { createFormResponseError, getFormErrorMessage } from "../../lib/vfx-form-errors";


const emptyForm: RegisterFormData = {
  storeName: '', contactName: '', email: '', whatsapp: '', cnpj: '',
  instagram: '', brandsSold: '', storeType: '', hasPhysicalStore: '', interestedBrand: '',
};

const logLeadScore = (scoring: ReturnType<typeof qualifyLead>, source: string) => {
  const calculation = scoring.lead_score_details.map(item => item.points ?? 0).join(' + ');
  console.group(`Lead score: ${scoring.lead_score}/100 — ${scoring.qualification_status} (${source})`);
  console.table(scoring.lead_score_details);
  console.log(`Somatório: ${calculation} = ${scoring.lead_score}`);
  console.log('Qualificado:', scoring.qualified);
  console.log('Desqualificado:', scoring.disqualified);
  console.log('Motivos de desqualificação:', scoring.disqualification_reasons.length
    ? scoring.disqualification_reasons.join('; ') : 'Nenhuma regra de desqualificação identificada nos dados disponíveis.');
  if (!scoring.score_complete) {
    console.warn('Pontuação parcial. Pendências:', scoring.qualification_pending_reasons.join('; '));
  }
  console.log('Detalhamento completo:', scoring);
  console.groupEnd();
};

export const RegisterForm: React.FC = () => {
  const tracker = useMetaPixel();
  const [formData, setFormData] = useState<RegisterFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [curationBlocked, setCurationBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const showErrors = (nextErrors: Record<string, string>) => {
    setErrors(nextErrors);
    const field = document.getElementById(Object.keys(nextErrors)[0]);
    if (field?.closest('fieldset')?.disabled) {
      requestAnimationFrame(() => { field.scrollIntoView({ behavior: 'smooth', block: 'center' }); field.focus({ preventScroll: true }); });
      return;
    }
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus({ preventScroll: true });
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
    const { name, value } = e.target;
    
    if (name === 'cnpj') {
      const cnpj = formatCNPJ(value.replace(/\D/g, '').slice(0, 14));
      const digits = normalizeCNPJ(cnpj);
      const validChecksum = digits.length === 14 && isValidCNPJ(digits);

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

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    const validationErrors = validateLead(formData);
    if (Object.keys(validationErrors).length) { showErrors(validationErrors); return; }
    if (isCurationBlocked(formData)) {
      setCurationBlocked(true);
      setErrors({});
      return;
    }
    submitting.current = true;

    logLeadScore(qualifyLead(formData), 'prévia antes da consulta do CNPJ');

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

      const result = await response.json();
      if (result.scoring) {
        logLeadScore(result.scoring, 'avaliação do servidor');
      }
      if (!response.ok) {
        if (result.errors) { showErrors(result.errors); return; }
        throw await createFormResponseError(response, result);
      }
      if (result.curationBlocked) {
        setCurationBlocked(true);
        setErrors({});
        return;
      }
      setSubmitted(true);
      setErrors({});
      if (result.scoring) void trackAcceptedLead(formData, result.scoring, tracker);
    } catch (formError) {
      setErrors(prev => ({
        ...prev,
        submit: getFormErrorMessage(formError, "Não foi possível concluir o envio agora. Suas respostas foram mantidas no formulário. Tente enviar novamente em instantes."),
      }));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <section
      id="cta-form"
      className="relative py-16 sm:py-24 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `url('/grupo-bilitex-formulario-v2.png')`
      }}
    >
      {/* Preserva links externos antigos para #cadastro. */}
      <span id="cadastro" className="absolute top-0" aria-hidden="true" />
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
          className="bg-black/55 backdrop-blur-sm p-6 sm:p-10 text-left shadow-2xl rounded-xl"
        >
          
          <AnimatePresence mode="wait">
            {submitted || curationBlocked ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="py-12 text-center space-y-6"
                role="status"
                id="form-result"
                tabIndex={-1}
                onAnimationComplete={() => {
                  const result = document.getElementById('form-result');
                  result?.focus({ preventScroll: true });
                  result?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${curationBlocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                >
                  {curationBlocked ? <X size={36} aria-hidden="true" /> : <CheckCircle2 size={36} aria-hidden="true" />}
                </motion.div>
                <div className="space-y-2 max-w-lg mx-auto">
                  {curationBlocked ? (
                    <p className="text-base text-white/80 whitespace-pre-line">{'Infelizmente, informamos que o seu cadastro não foi selecionado para avançarmos neste momento.\n\nComo nosso processo de entrada passa por uma curadoria interna, não conseguiremos seguir com a parceria agora.\n\nAgradecemos o seu interesse na nossa marca e desejamos muito sucesso!'}</p>
                  ) : <>
                  <h3 className="text-2xl font-bold text-white">
                    Solicitação Enviada com Sucesso!
                  </h3>
                  <p className="text-base text-white/80">
                    {FORM_CONTENT.successMessage}
                  </p>
                  </>}
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
                
                <fieldset disabled={loading} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Nome da loja */}
                  <div className="space-y-1.5">
                    <label htmlFor="storeName" className="block text-xs font-bold uppercase tracking-wider text-white">
                      Nome da Loja *
                    </label>
                    <input
                      type="text"
                      id="storeName"
                      name="storeName"
                      required
                      aria-invalid={Boolean(errors.storeName)}
                      aria-describedby={errors.storeName ? "storeName-error" : undefined}
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Ex: Boutique Infantil & Teen"
                      className={`w-full bg-white/10 ${
                        errors.storeName ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white transition-colors rounded-xl`}
                    />
                    {errors.storeName && (
                      <p id="storeName-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.storeName}
                      </p>
                    )}
                  </div>

                  {/* Nome do responsável */}
                  <div className="space-y-1.5">
                    <label htmlFor="contactName" className="block text-xs font-bold uppercase tracking-wider text-white">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      required
                      aria-invalid={Boolean(errors.contactName)}
                      aria-describedby={errors.contactName ? "contactName-error" : undefined}
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      className={`w-full bg-white/10 ${
                        errors.contactName ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white transition-colors rounded-xl`}
                    />
                    {errors.contactName && (
                      <p id="contactName-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.contactName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-white">E-mail *</label>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange}
                      autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined}
                      placeholder="voce@exemplo.com"
                      className={`w-full bg-white/10 p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white rounded-xl ${errors.email ? 'ring-1 ring-red-600' : ''}`} />
                    {errors.email && <p id="email-error" role="alert" className="text-xs text-red-600">{errors.email}</p>}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label htmlFor="whatsapp" className="block text-xs font-bold uppercase tracking-wider text-white">
                      WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      maxLength={15}
                      inputMode="tel"
                      required
                      aria-invalid={Boolean(errors.whatsapp)}
                      aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="(00) 90000-0000"
                      className={`w-full bg-white/10 ${
                        errors.whatsapp ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white transition-colors rounded-xl`}
                    />
                    {errors.whatsapp && (
                      <p id="whatsapp-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.whatsapp}
                      </p>
                    )}
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-1.5">
                    <label htmlFor="cnpj" className="block text-xs font-bold uppercase tracking-wider text-white">
                      CNPJ da Loja *
                    </label>
                    <input
                      type="text"
                      id="cnpj"
                      name="cnpj"
                      required
                      value={formData.cnpj}
                      onChange={handleChange}
                      onBlur={handleCNPJBlur}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={18}
                      aria-invalid={Boolean(errors.cnpj)}
                      aria-describedby={errors.cnpj ? 'cnpj-error' : undefined}
                      placeholder="00.000.000/0000-00"
                      className={`w-full bg-white/10 ${
                        errors.cnpj ? 'ring-1 ring-red-600' : ''
                      } p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white transition-colors rounded-xl`}
                    />
                    {errors.cnpj && (
                      <p id="cnpj-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.cnpj}
                      </p>
                    )}
                  </div>

                  {/* Instagram da loja */}
                  <div className="space-y-1.5">
                    <label htmlFor="instagram" className="block text-xs font-bold uppercase tracking-wider text-white">
                      Instagram da Loja *
                    </label>
                    <input
                      type="text"
                      id="instagram"
                      name="instagram"
                      required
                      aria-invalid={Boolean(errors.instagram)}
                      aria-describedby={errors.instagram ? "instagram-error" : undefined}
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="@sualoja"
                      className={` ${errors.instagram ? "ring-1 ring-red-600" : ""} w-full bg-white/10 p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white transition-colors rounded-xl`}
                    />
                    {errors.instagram && <p id="instagram-error" role="alert" className="text-xs text-red-600">{errors.instagram}</p>}
                  </div>

                  {/* Principais marcas já vendidas */}
                  <div className="space-y-1.5">
                    <label htmlFor="brandsSold" className="block text-xs font-bold uppercase tracking-wider text-white">
                      Principais Marcas que Já Vende *
                    </label>
                    <input
                      type="text"
                      id="brandsSold"
                      name="brandsSold"
                      required
                      aria-invalid={Boolean(errors.brandsSold)}
                      aria-describedby={errors.brandsSold ? "brandsSold-error" : undefined}
                      value={formData.brandsSold}
                      onChange={handleChange}
                      placeholder="Ex: Marca A, Marca B..."
                      className={` ${errors.brandsSold ? "ring-1 ring-red-600" : ""} w-full bg-white/10 p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white transition-colors rounded-xl`}
                    />
                    {errors.brandsSold && <p id="brandsSold-error" role="alert" className="text-xs text-red-600">{errors.brandsSold}</p>}
                  </div>

                </div>

                {[
                  { name: 'storeType', label: 'Tipo de Loja', options: storeOptions },
                  { name: 'hasPhysicalStore', label: 'Possui loja física?', options: physicalStoreOptions },
                  { name: 'interestedBrand', label: 'Marca de Interesse Principal', options: brandOptions.map(label => ({ value: label, label })) },
                ].map(({ name, label, options }) => (
                  <div key={name} className="space-y-1.5">
                    <label htmlFor={name} className="block text-xs font-bold uppercase tracking-wider text-white">{label} *</label>
                    <select id={name} name={name} required value={formData[name as keyof RegisterFormData]} onChange={handleChange}
                      aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}
                      className={`w-full bg-white/10 p-3.5 sm:p-3 text-base sm:text-sm text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-white rounded-xl [&>option]:text-black ${errors[name] ? 'ring-1 ring-red-600' : ''}`}>
                      <option value="" disabled>Selecionar</option>
                      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    {errors[name] && <p id={`${name}-error`} role="alert" className="text-xs text-red-600">{errors[name]}</p>}
                  </div>
                ))}

                {/* Submit Button */}
                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.03, backgroundColor: '#1F1F1F' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white transition-all text-sm font-bold px-10 py-4 uppercase tracking-wider cursor-pointer focus:outline-none disabled:opacity-50 shadow-md rounded-xl border border-white/30"
                  >
                    {loading ? 'Processando envio...' : 'Quero ser lojista parceiro'}
                  </motion.button>
                  {errors.submit && (
                    <p role="alert" className="mt-3 text-sm text-red-600">
                      {errors.submit}
                    </p>
                  )}
                </div>

                </fieldset>
              </motion.form>
            )}
          </AnimatePresence>

        </motion.div>

      </div>
    </section>
  );
};
