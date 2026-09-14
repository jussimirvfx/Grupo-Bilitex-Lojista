import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onNavigateToForm: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToForm }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Check initial scroll
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const isSolid = isScrolled || mobileMenuOpen;

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSolid
          ? 'bg-white/95 backdrop-blur-md border-b border-[#B1AEA7]/20 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22">
          
          {/* Logo Grupo Bilitex */}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center justify-center group cursor-pointer focus:outline-none py-1"
            aria-label="Grupo Bilitex - Página Inicial"
          >
            <img 
              src="https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/bilitex-logo-1787778591992.webp" 
              alt="Grupo Bilitex" 
              className="h-8 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
          </a>

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8" aria-label="Navegação principal">
            <button
              onClick={() => scrollTo('colecoes')}
              className={`text-xs lg:text-sm font-medium transition-colors cursor-pointer focus:outline-none ${
                isSolid ? 'text-black/80 hover:text-black' : 'text-white hover:text-white/80'
              }`}
            >
              Coleções
            </button>
            <button
              onClick={() => scrollTo('marcas')}
              className={`text-xs lg:text-sm font-medium transition-colors cursor-pointer focus:outline-none ${
                isSolid ? 'text-black/80 hover:text-black' : 'text-white hover:text-white/80'
              }`}
            >
              Nossas Marcas
            </button>
            <button
              onClick={() => scrollTo('sobre')}
              className={`text-xs lg:text-sm font-medium transition-colors cursor-pointer focus:outline-none ${
                isSolid ? 'text-black/80 hover:text-black' : 'text-white hover:text-white/80'
              }`}
            >
              Sobre
            </button>
            <button
              onClick={() => scrollTo('duvidas')}
              className={`text-xs lg:text-sm font-medium transition-colors cursor-pointer focus:outline-none ${
                isSolid ? 'text-black/80 hover:text-black' : 'text-white hover:text-white/80'
              }`}
            >
              Dúvidas
            </button>
          </nav>

          {/* Desktop & Tablet CTA Button */}
          <div className="hidden md:block">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onNavigateToForm}
              className="bg-[#FBE64E] text-black hover:bg-[#ebd73f] transition-colors text-xs lg:text-sm font-bold px-4 py-2.5 lg:px-6 lg:py-3 tracking-wide cursor-pointer focus:outline-none shadow-sm whitespace-nowrap"
            >
              Quero ser lojista parceiro
            </motion.button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 focus:outline-none cursor-pointer ${
                isSolid ? 'text-black hover:text-[#B1AEA7]' : 'text-white hover:text-white/80'
              }`}
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white border-b border-[#B1AEA7]/30 px-6 py-6 space-y-6 shadow-md"
          >
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => scrollTo('colecoes')}
                className="text-left text-base font-medium text-black py-2 border-b border-[#B1AEA7]/10 focus:outline-none"
              >
                Coleções
              </button>
              <button
                onClick={() => scrollTo('marcas')}
                className="text-left text-base font-medium text-black py-2 border-b border-[#B1AEA7]/10 focus:outline-none"
              >
                Nossas Marcas
              </button>
              <button
                onClick={() => scrollTo('sobre')}
                className="text-left text-base font-medium text-black py-2 border-b border-[#B1AEA7]/10 focus:outline-none"
              >
                Sobre
              </button>
              <button
                onClick={() => scrollTo('duvidas')}
                className="text-left text-base font-medium text-black py-2 border-b border-[#B1AEA7]/10 focus:outline-none"
              >
                Dúvidas
              </button>
            </nav>
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToForm();
                }}
                className="w-full bg-[#FBE64E] text-black text-center text-sm font-bold py-3 px-6 cursor-pointer focus:outline-none shadow-sm hover:bg-[#ebd73f] transition-colors"
              >
                Quero ser lojista parceiro
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
