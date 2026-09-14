import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface StickyMobileCTAProps {
  onCtaClick: () => void;
}

export const StickyMobileCTA: React.FC<StickyMobileCTAProps> = ({ onCtaClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past 400px
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-3 border-t border-[#B1AEA7]/30 shadow-lg"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCtaClick}
            className="w-full bg-black text-white active:bg-[#B1AEA7] active:text-black transition-colors text-xs font-bold py-3.5 px-4 uppercase tracking-wider cursor-pointer focus:outline-none"
          >
            Quero ser lojista parceiro
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
