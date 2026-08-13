'use client';

import { useEffect, useRef, useState } from 'react';
import { formatINR } from '@/lib/format';

const DURATION = 420;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A rupee figure that rolls to its new value.
 *
 * This is the one piece of motion that runs on every device, because it belongs
 * to the EMI calculator: seeing the number move is what tells you your input
 * landed. It still stops for `prefers-reduced-motion`, and the rAF loop cancels
 * the moment the value settles — nothing ticks while the page is idle.
 */
export function NumberRoll({
  value,
  className = '',
  format = formatINR,
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;

    if (prefersReduced || from === value) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION);
      setDisplay(from + (value - from) * easeOut(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value]);

  return (
    <span className={`tnum ${className}`} aria-live="polite">
      {format(display)}
    </span>
  );
}
