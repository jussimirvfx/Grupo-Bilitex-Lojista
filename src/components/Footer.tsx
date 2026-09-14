import React from 'react';
import { Instagram } from 'lucide-react';
import { motion } from 'motion/react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-14 pb-32 sm:pt-16 sm:pb-24 md:py-16 lg:py-20 border-t border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 lg:gap-8 text-center md:text-left"
        >
          {/* Logo Grupo Bilitex + Submarcas */}
          <div className="flex flex-col items-center md:items-start justify-center gap-2">
            <img 
              src="https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/bilitex-logo-1787778591992.webp" 
              alt="Grupo Bilitex" 
              className="h-8 sm:h-9 md:h-8 lg:h-11 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-3 md:gap-3 lg:gap-4 pl-0.5 mt-1">
              <img 
                src="https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/logo-bak-1787778831149.webp" 
                alt="Bakulelê" 
                className="h-4 sm:h-5 md:h-4 lg:h-6 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/logo-2-1787778848299.webp" 
                alt="Biliton" 
                className="h-4 sm:h-5 md:h-4 lg:h-6 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs sm:text-xs md:text-[11px] lg:text-sm text-white/80 font-medium md:max-w-[240px] lg:max-w-none">
            2026, Mais Lojistas © Todos os direitos reservados.
          </p>

          {/* Instagram Links Stacked Vertically */}
          <div className="flex flex-col items-center md:items-start gap-2.5 text-xs lg:text-sm">
            <motion.a
              whileHover={{ x: 4 }}
              href="https://www.instagram.com/grupobilitex/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              title="Instagram Grupo Bilitex"
            >
              <Instagram size={18} className="text-[#FBE64E] shrink-0" />
              <span>@grupobilitex</span>
            </motion.a>
            <motion.a
              whileHover={{ x: 4 }}
              href="https://www.instagram.com/bakulele/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              title="Instagram Bakulelê"
            >
              <Instagram size={18} className="text-[#FBE64E] shrink-0" />
              <span>@bakulele</span>
            </motion.a>
            <motion.a
              whileHover={{ x: 4 }}
              href="https://www.instagram.com/biliton_oficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              title="Instagram Biliton"
            >
              <Instagram size={18} className="text-[#FBE64E] shrink-0" />
              <span>@biliton_oficial</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
