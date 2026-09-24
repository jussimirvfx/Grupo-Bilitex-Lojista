import React, { useState, useEffect, useRef } from 'react';
import { BAKULELE_CONTENT, BILITON_CONTENT } from '../data/content';
import { BrandInterest, GalleryItem } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface CollectionsProps {
  onSelectBrandCTA: (brand: BrandInterest) => void;
}

interface BrandCarouselProps {
  items: GalleryItem[];
}

const BrandCarousel: React.FC<BrandCarouselProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);
  const touchStartX = useRef<number | null>(null);
  const maxIndex = Math.max(0, items.length - itemsPerView);

  // Responsive items per view detection (1 on mobile, 2 on tablet, 4 on desktop)
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1); // Mobile: 1 foto por vez
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet: 2 fotos por vez
      } else {
        setItemsPerView(4); // Desktop: 4 fotos por vez
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Auto-scroll every 3s smoothly
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, maxIndex]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsHovered(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    setIsHovered(false);
  };

  return (
    <div
      className="relative max-w-6xl mx-auto px-8 sm:px-10 md:px-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute -left-1 sm:-left-3 md:-left-6 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 sm:p-2.5 md:p-3 shadow-lg transition-all duration-300 focus:outline-none cursor-pointer rounded-full"
        aria-label="Imagem Anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute -right-1 sm:-right-3 md:-right-6 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 sm:p-2.5 md:p-3 shadow-lg transition-all duration-300 focus:outline-none cursor-pointer rounded-full"
        aria-label="Próxima Imagem"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
      </button>

      {/* Smooth Sliding Track Container */}
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{ width: `${100 / itemsPerView}%` }}
              className="flex-shrink-0 px-2 sm:px-2.5"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#B1AEA7]/15 rounded-xl shadow-xs group">
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Collections: React.FC<CollectionsProps> = ({ onSelectBrandCTA }) => {
  return (
    <>
      {/* Section: Marcas Intro Header (Fundo Preto, Título #FBE64E, Texto Branco) */}
      <section id="marcas" className="bg-black pt-12 sm:pt-16 pb-8 sm:pb-10">
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#FBE64E] tracking-tight leading-snug">
            <span className="block"><strong className="font-black not-italic">Duas marcas</strong> para acompanhar</span>
            <span className="block">diferentes fases do seu público</span>
          </h2>
          <p className="text-base sm:text-lg text-white leading-relaxed font-normal max-w-2xl mx-auto">
            Do baby ao teen, o Grupo Bilitex reúne coleções desenvolvidas para fortalecer o mix de boutiques e multimarcas.
          </p>
        </motion.div>
      </section>

      {/* Section: Coleções e Galerias */}
      <section id="colecoes" className="pt-8 sm:pt-12 pb-16 sm:pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14 text-center">

          {/* ================= MARCA 1: BAKULELÊ ================= */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="space-y-8 text-center"
        >
          {/* Brand Title Centered */}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl text-black tracking-tight font-bold">
              {BAKULELE_CONTENT.title}
            </h3>
            <p className="text-base sm:text-lg font-bold text-black">
              {BAKULELE_CONTENT.tagline}
            </p>
          </div>

          {/* Smooth Continuous Carousel */}
          <BrandCarousel items={BAKULELE_CONTENT.gallery} />

          {/* Clean Topic Cards with Staggered Hover Effect */}
          <div className="max-w-6xl mx-auto px-8 sm:px-10 md:px-0 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {BAKULELE_CONTENT.topics.map((topic, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#FBE64E] p-4 rounded-xl text-center font-semibold text-sm sm:text-base text-black flex items-center justify-center min-h-[72px] shadow-sm hover:shadow-md cursor-default"
                >
                  {topic}
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button Under Topics */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#333333' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectBrandCTA('Bakulelê')}
              className="inline-flex items-center justify-center bg-black text-white transition-colors text-sm sm:text-base font-bold px-8 py-4 tracking-wide cursor-pointer focus:outline-none shadow-md rounded-xl"
            >
              {BAKULELE_CONTENT.ctaText}
            </motion.button>
          </div>
        </motion.div>

        {/* ================= MARCA 2: BILITON ================= */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="space-y-8 text-center pt-2"
        >
          {/* Brand Title Centered */}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl text-black tracking-tight font-bold">
              {BILITON_CONTENT.title}
            </h3>
            <p className="text-base sm:text-lg font-semibold text-black">
              {BILITON_CONTENT.subtitle}
            </p>
          </div>

          {/* Smooth Continuous Carousel */}
          <BrandCarousel items={BILITON_CONTENT.gallery} />

          {/* Clean Topic Cards with Staggered Hover Effect */}
          <div className="max-w-6xl mx-auto px-8 sm:px-10 md:px-0 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {BILITON_CONTENT.topics.map((topic, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#FBE64E] p-4 rounded-xl text-center font-semibold text-sm sm:text-base text-black flex items-center justify-center min-h-[72px] shadow-sm hover:shadow-md cursor-default"
                >
                  {topic}
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button Under Topics */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#333333' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectBrandCTA('Biliton')}
              className="inline-flex items-center justify-center bg-black text-white transition-colors text-sm sm:text-base font-bold px-8 py-4 tracking-wide cursor-pointer focus:outline-none shadow-md rounded-xl"
            >
              {BILITON_CONTENT.ctaText}
            </motion.button>
          </div>
        </motion.div>

      </div>
    </section>
    </>
  );
};
