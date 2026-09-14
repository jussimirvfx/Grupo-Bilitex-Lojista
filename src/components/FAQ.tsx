import React, { useState } from 'react';
import { FAQ_CONTENT } from '../data/content';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="duvidas" className="py-16 sm:py-24 bg-black overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FBE64E] tracking-tight">
            Dúvidas frequentes
          </h2>
        </motion.div>

        {/* Accordion Container with Animated Accordion Items */}
        <div className="space-y-4">
          {FAQ_CONTENT.map((faq, index) => {
            const isOpen = openId === faq.id;
            return (
              <motion.div 
                key={faq.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-black p-5 sm:p-6 transition-colors border border-[#FBE64E] text-left"
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-semibold text-white group-hover:text-[#FBE64E] transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-[#FBE64E] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 text-sm sm:text-base text-white/85 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
