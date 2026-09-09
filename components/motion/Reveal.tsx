'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnyMotion } from '@/lib/useMotionTier';

type Props = {
  children: React.ReactNode;
  /** Stagger within a group: 40–80ms per step, one direction only. */
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'tr' | 'article' | 'header';
  className?: string;
};

/**
 * Section entrance, on every device.
 *
 * The static, finished state is what renders first — on the server, under
 * `prefers-reduced-motion`, on a metered connection, and if JavaScript never
 * arrives. Motion is layered on top when `useAnyMotion()` says it is welcome,
 * which now includes phones: one composited transform per section, and the
 * observer disconnects the moment an element has revealed, so nothing stays
 * bound to the scroller.
 */
export function Reveal({ children, delay = 0, as = 'div', className = '' }: Props) {
  const Tag = as;
  const ref = useRef<HTMLElement | null>(null);
  const reduced = !useAnyMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const motionClass = reduced ? 'reveal-static' : shown ? 'reveal reveal-in' : 'reveal';

  return (
    <Tag
      ref={ref as never}
      className={`${motionClass} ${className}`}
      style={reduced ? undefined : ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties)}
    >
      {children}
    </Tag>
  );
}
