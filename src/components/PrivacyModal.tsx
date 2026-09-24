import React from 'react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 text-left space-y-6 relative shadow-2xl rounded-xl">
        
        <div className="flex items-center justify-between border-b border-[#B1AEA7]/20 pb-4">
          <h3 className="text-xl font-bold text-black uppercase tracking-wider">
            Política de Privacidade & LGPD
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-black hover:text-[#B1AEA7] cursor-pointer focus:outline-none rounded-lg"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-black/80 leading-relaxed font-normal">
          <p>
            O <strong>Grupo Bilitex</strong> compromete-se com a segurança, privacidade e proteção dos dados corporativos e pessoais de seus parceiros lojistas, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
          </p>
          
          <h4 className="font-bold text-black text-sm uppercase">1. Coleta e Finalidade dos Dados</h4>
          <p>
            Os dados cadastrais solicitados neste portal (como Nome da Loja, CNPJ, Responsável, Telefone, Estado e Cidade) são coletados exclusivamente para fins de avaliação cadastral, análise de perfil comercial e contato direto por parte da nossa equipe comercial ou representantes autorizados da sua região.
          </p>

          <h4 className="font-bold text-black text-sm uppercase">2. Compartilhamento Seguro</h4>
          <p>
            Seus dados são tratados de forma confidencial e não serão vendidos ou repassados a terceiros não autorizados. O compartilhamento ocorre estritamente no âmbito interno do Grupo Bilitex e com o representante comercial designado para a sua região geográfica.
          </p>

          <h4 className="font-bold text-black text-sm uppercase">3. Direitos do Lojista</h4>
          <p>
            O responsável cadastrado pode a qualquer momento solicitar a confirmação, atualização ou exclusão dos seus dados de nosso banco de contato comercial enviando um e-mail para a equipe de suporte.
          </p>
        </div>

        <div className="pt-4 border-t border-[#B1AEA7]/20 flex justify-end">
          <button
            onClick={onClose}
            className="bg-black text-white hover:bg-[#B1AEA7] hover:text-black transition-colors text-xs font-bold px-6 py-2.5 uppercase tracking-wider cursor-pointer focus:outline-none rounded-xl"
          >
            Compreendi
          </button>
        </div>

      </div>
    </div>
  );
};
