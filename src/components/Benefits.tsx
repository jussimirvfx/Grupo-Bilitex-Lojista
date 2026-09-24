import React from 'react';
import { BENEFITS_CONTENT } from '../data/content';
import { LayoutGrid, Layers, Globe2, Headset } from 'lucide-react';
import { motion } from 'motion/react';

export const Benefits: React.FC = () => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'ben-1':
        return <LayoutGrid size={28} className="text-black" />;
      case 'ben-2':
        return <Layers size={28} className="text-black" />;
      case 'ben-3':
        return <Globe2 size={28} className="text-black" />;
      case 'ben-4':
        return <Headset size={28} className="text-black" />;
      default:
        return <LayoutGrid size={28} className="text-black" />;
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#FBE64E] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center space-y-3"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
            Por que levar o Grupo Bilitex para a sua loja
          </h2>
        </motion.div>

        {/* Benefits Cards with Staggered Entrance and Hover Lift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {BENEFITS_CONTENT.map((benefit, index) => (
            <motion.div 
              key={benefit.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <motion.div
                whileHover={{ y: -4, scale: 1.015, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="h-full bg-white p-6 sm:p-8 space-y-3 text-left border-none shadow-sm cursor-default rounded-xl"
              >
                <div className="mb-2">
                  {getIcon(benefit.id)}
                </div>
                <h3 className="text-lg font-bold text-black tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-sm text-black/80 leading-relaxed font-normal">
                  {benefit.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
