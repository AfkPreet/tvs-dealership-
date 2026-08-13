'use client';

import { useEffect, useRef } from 'react';
import { useReducedExperience } from '@/lib/useReducedExperience';

const RADIUS = 90;
const PULL = 0.22;

/**
 * Primary CTAs drift a few pixels toward the cursor inside a small radius.
 *
 * Cheap and tactile: pointer events only, `transform` only, no rAF loop. The
 * listener is bound to the element rather than the window, so nothing runs while
 * the pointer is elsewhere on the page.
 */
export function Magnetic({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedExperience();

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance > RADIUS + rect.width / 2) {
        node.style.transform = '';
        return;
      }
      node.style.transform = `translate3d(${dx * PULL}px, ${dy * PULL}px, 0)`;
    };

    const reset = () => {
      node.style.transform = '';
    };

    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
      reset();
    };
  }, [reduced]);

  return (
    <span
      ref={ref}
      className={`inline-flex transition-transform duration-300 ease-out ${className}`}
      style={{ willChange: reduced ? undefined : 'transform' }}
    >
      {children}
    </span>
  );
}
