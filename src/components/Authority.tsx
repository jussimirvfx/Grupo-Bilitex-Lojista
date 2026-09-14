import React, { useEffect, useRef, useState } from 'react';
import { AUTHORITY_METRICS } from '../data/content';
import { motion } from 'motion/react';

interface AnimatedCounterProps {
  valueStr: string;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ valueStr, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const countRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Parse prefix (e.g. "+"), numeric value (e.g. 35, 700, 1.2), and suffix (e.g. "M")
    const match = valueStr.match(/^(\+)?([\d.]+)([A-Za-z]*)?$/);
    const prefix = match?.[1] || '';
    const numericTarget = match ? parseFloat(match[2]) : 0;
    const suffix = match?.[3] || '';
    const isDecimal = match ? match[2].includes('.') : false;
    const decimalPlaces = isDecimal && match ? match[2].split('.')[1].length : 0;

    const element = countRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();

          const updateNumber = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic for smooth slowing down at end
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentNum = easeOutProgress * numericTarget;

            if (isDecimal) {
              setDisplayValue(`${prefix}${currentNum.toFixed(decimalPlaces)}${suffix}`);
            } else {
              setDisplayValue(`${prefix}${Math.floor(currentNum)}${suffix}`);
            }

            if (progress < 1) {
              requestAnimationFrame(updateNumber);
            } else {
              setDisplayValue(valueStr);
            }
          };

          requestAnimationFrame(updateNumber);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [valueStr, duration]);

  return (
    <div ref={countRef} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FBE64E] tracking-tight font-sans">
      {displayValue}
    </div>
  );
};

export const Authority: React.FC = () => {
  return (
    <section className="bg-black py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-center"
        >
          {AUTHORITY_METRICS.map((metric, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.05 }}
              className="space-y-1 cursor-default transition-transform"
            >
              <AnimatedCounter valueStr={metric.value} duration={2000} />
              <p className="text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

