import { useEffect, useRef } from 'react';
import { useMetaPixel } from 'scoretrack';

const MILESTONES = [0, 25, 50, 75, 100];

export function MetaScrollTracking() {
  const { trackCustomEvent } = useMetaPixel();
  const sent = useRef(new Set<number>());

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const position = Math.max(0, window.scrollY);
      const percentage = maxScroll > 0 ? Math.min(100, position / maxScroll * 100) : 0;
      for (const depth of MILESTONES) {
        // Tolerância de 1px no rodapé para posições fracionárias do navegador.
        const reached = depth === 100 ? maxScroll > 0 && position >= maxScroll - 1 : percentage >= depth;
        if (!reached || sent.current.has(depth)) continue;
        sent.current.add(depth);
        void trackCustomEvent('Scroll', { scroll_depth: depth, scroll_percentage: percentage })
          .catch(() => console.warn('Não foi possível concluir o evento de scroll.'));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackCustomEvent]);

  return null;
}
