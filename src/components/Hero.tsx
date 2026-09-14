import React, { useState, useEffect } from 'react';
import { HERO_CONTENT } from '../data/content';
import { motion } from 'motion/react';

interface HeroProps {
  onCtaClick: () => void;
}

const HERO_SLIDES = [
  {
    id: 'bakulele',
    brand: 'Bakulelê',
    logo: 'https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/logo-bak-1787778831149.webp',
    isWhiteFilter: true,
    subtitle: 'Moda Baby e Infantil · Grade P ao 14',
    tag: '[Foto Campanha Hero - Bakulelê]',
    url: 'https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/prancheta-1-1787779052897.webp',
    alt: 'Grupo Bilitex - Bakulelê Moda Infantil'
  },
  {
    id: 'biliton',
    brand: 'Biliton',
    logo: 'https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/logo-2-1787778848299.webp',
    isWhiteFilter: false,
    subtitle: 'Moda Teen & Fashion Denim · Grade 12 ao 20',
    tag: '[Foto Campanha Hero - Biliton]',
    url: 'https://frwfcibbvbj5zog7.public.blob.vercel-storage.com/geral/prancheta-1-copiar-1787779051771.webp',
    alt: 'Grupo Bilitex - Biliton Moda Teen'
  }
];

export const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000); // Alterna a cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[92vh] sm:min-h-[88vh] lg:min-h-[90vh] flex items-end lg:items-center justify-start overflow-hidden bg-black pt-28 sm:pt-36 md:pt-40 lg:pt-20 pb-24 sm:pb-24 lg:pb-20">
      
      {/* Background Slideshow with 3s Alternating Cross-Fade */}
      <div className="absolute inset-0 z-0">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } transition-transform duration-[4000ms]`}
            >
              <img
                src={slide.url}
                alt={slide.alt}
                className="w-full h-full object-cover object-[85%_center] xs:object-[82%_center] sm:object-[75%_center] md:object-[78%_center] lg:object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              {/* Refined gradient overlay for crisp image visibility and legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent sm:from-black/90 sm:via-black/50 sm:to-transparent w-full sm:w-3/4 md:w-3/5 lg:w-1/2" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20 sm:hidden" />
            </div>
          );
        })}
      </div>

      {/* Main Content Overlay with Staggered Entrance Animations */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-xl sm:max-w-md md:max-w-lg lg:max-w-2xl text-left space-y-4 sm:space-y-5 lg:space-y-6"
        >
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.18] drop-shadow-sm font-normal"
          >
            <span className="block"><strong className="font-extrabold text-white">Lojista</strong>, leve moda</span>
            <span className="block">infantil e teen para</span>
            <span className="block">a sua loja.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed font-semibold max-w-xl drop-shadow-sm"
          >
            {HERO_CONTENT.subheadline}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 20px 25px -5px rgba(251, 230, 78, 0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onCtaClick}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FBE64E] text-black hover:bg-[#ebd73f] transition-colors text-sm sm:text-base font-bold px-8 py-4 tracking-wide cursor-pointer focus:outline-none shadow-xl min-h-[48px]"
            >
              {HERO_CONTENT.ctaText}
            </motion.button>
          </motion.div>

        </motion.div>
      </div>

      {/* Soft Bottom Gradient Overlay across the banner base */}
      <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

      {/* Brand Indicators (Logos for Bakulelê and Biliton floating over the bottom gradient overlay) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-10 md:right-12 z-20 flex items-center gap-6 sm:gap-10"
      >
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <motion.button
              key={slide.id}
              onClick={() => setActiveSlide(index)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`transition-all duration-300 cursor-pointer focus:outline-none flex items-center p-1 ${
                isActive
                  ? 'opacity-100 scale-105 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]'
                  : 'opacity-45 hover:opacity-85 scale-95'
              }`}
              aria-label={`Ver slide ${slide.brand}`}
            >
              <img
                src={slide.logo}
                alt={slide.brand}
                className={`h-8 sm:h-10 md:h-12 w-auto object-contain transition-all drop-shadow-md ${
                  slide.isWhiteFilter ? 'brightness-0 invert' : ''
                }`}
                referrerPolicy="no-referrer"
              />
            </motion.button>
          );
        })}
      </motion.div>

    </section>
  );
};
