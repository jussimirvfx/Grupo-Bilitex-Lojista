import React from 'react';
import { ABOUT_CONTENT } from '../data/content';
import { motion } from 'motion/react';

export const About: React.FC = () => {
  return (
    <section id="sobre" className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Institutional Image */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-6 order-2 lg:order-1"
          >
            <div className="relative aspect-video bg-[#B1AEA7]/30 overflow-hidden shadow-lg group rounded-xl">
              <img
                src={ABOUT_CONTENT.image.url}
                alt={ABOUT_CONTENT.image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Institutional Content */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight leading-tight">
              {ABOUT_CONTENT.title}
            </h2>
            <p className="text-base sm:text-lg text-black/80 leading-relaxed">
              {ABOUT_CONTENT.paragraph}
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
