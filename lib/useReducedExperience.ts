'use client';

import { useEffect, useState } from 'react';

const DESKTOP_MOTION_MIN_WIDTH = 1280;

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

function readConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function computeReduced(): boolean {
  if (typeof window === 'undefined') return true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if (window.innerWidth < DESKTOP_MOTION_MIN_WIDTH) return true;

  const connection = readConnection();
  if (connection?.saveData) return true;
  if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') return true;
  if (connection?.effectiveType === '3g') return true;

  return false;
}

/**
 * The single gate for the entire motion layer.
 *
 * Returns `true` — meaning "render the static final state" — for viewports under
 * 1280px, for `prefers-reduced-motion: reduce`, for Data Saver, and for 2G/3G
 * connections. It also returns `true` on the server and on the very first client
 * render, so the exported HTML is the finished, static page: if JavaScript never
 * arrives, the site is complete rather than mid-animation.
 *
 * Every motion component reads this hook. Nothing animates without it.
 */
export function useReducedExperience(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const update = () => setReduced(computeReduced());
    update();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const widthQuery = window.matchMedia(`(min-width: ${DESKTOP_MOTION_MIN_WIDTH}px)`);
    const connection = readConnection();

    motionQuery.addEventListener('change', update);
    widthQuery.addEventListener('change', update);
    connection?.addEventListener?.('change', update);

    return () => {
      motionQuery.removeEventListener('change', update);
      widthQuery.removeEventListener('change', update);
      connection?.removeEventListener?.('change', update);
    };
  }, []);

  return reduced;
}

/**
 * Narrower gate for the 360° spinner, which ships on mobile too — just with
 * fewer frames. Returns true when we should fetch a third of the sequence.
 */
export function useLowBandwidth(): boolean {
  const [low, setLow] = useState(true);

  useEffect(() => {
    const update = () => {
      const connection = readConnection();
      const slow =
        connection?.saveData === true ||
        connection?.effectiveType === '2g' ||
        connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '3g';
      setLow(Boolean(slow) || window.innerWidth < 768);
    };
    update();

    const widthQuery = window.matchMedia('(min-width: 768px)');
    const connection = readConnection();
    widthQuery.addEventListener('change', update);
    connection?.addEventListener?.('change', update);

    return () => {
      widthQuery.removeEventListener('change', update);
      connection?.removeEventListener?.('change', update);
    };
  }, []);

  return low;
}

/**
 * The one motion gate that is not desktop-only.
 *
 * The hero's arrival runs on every device, because it costs one composited
 * animation on load and is not bound to the scroller — the thing that actually
 * hurts on a phone. It still returns `false` on the server and on first paint,
 * so the exported HTML shows the finished hero and a visitor without JavaScript
 * never sees a mid-animation page.
 */
export function useOnLoadMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEnabled(true);
  }, []);

  return enabled;
}
