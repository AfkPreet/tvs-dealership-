'use client';

import { useEffect, useState } from 'react';

/** Above this width the pointer is almost certainly a mouse and the CPU is not a phone's. */
const FULL_MOTION_MIN_WIDTH = 1280;

export type MotionTier =
  /** Render the finished, static page. Server, first paint, reduced-motion, slow links. */
  | 'none'
  /** Everything that costs one composited animation each: reveals, count-ups, crossfades. */
  | 'light'
  /** Adds the scroll-bound and pointer-bound layer: parallax, cursor light, page wipes. */
  | 'full';

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

function computeTier(): MotionTier {
  if (typeof window === 'undefined') return 'none';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';

  const connection = readConnection();
  if (connection?.saveData) return 'none';
  const effective = connection?.effectiveType;
  if (effective === 'slow-2g' || effective === '2g' || effective === '3g') return 'none';

  return window.innerWidth >= FULL_MOTION_MIN_WIDTH ? 'full' : 'light';
}

/**
 * The single gate for the whole motion layer.
 *
 * Three tiers instead of the old on/off switch, because the client wants motion
 * that a phone visitor actually sees. `light` is the mobile tier: entrances,
 * count-ups and crossfades, each one composited animation that fires once and
 * unbinds. `full` adds the things that stay bound to the scroller or the pointer
 * and are only worth their cost on a desktop.
 *
 * It returns `'none'` on the server and on the very first client render, so the
 * exported HTML is the finished page. If JavaScript never arrives the site is
 * complete rather than frozen mid-animation.
 */
export function useMotionTier(): MotionTier {
  const [tier, setTier] = useState<MotionTier>('none');

  useEffect(() => {
    const update = () => setTier(computeTier());
    update();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const widthQuery = window.matchMedia(`(min-width: ${FULL_MOTION_MIN_WIDTH}px)`);
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

  return tier;
}

/** True once anything at all may animate — that is, on `light` or `full`. */
export function useAnyMotion(): boolean {
  return useMotionTier() !== 'none';
}

/** True only for the desktop layer: parallax, cursor light, page wipes, scroll binding. */
export function useFullMotion(): boolean {
  return useMotionTier() === 'full';
}

/**
 * The gate for things that happen once, on arrival, before any tier is known.
 *
 * The hero's entrance runs on every device: it costs one composited animation at
 * load and is not bound to the scroller, which is the thing that actually hurts
 * on a phone. Still `false` on the server and on first paint, so the exported
 * HTML shows the finished hero.
 */
export function useOnLoadMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEnabled(true);
  }, []);

  return enabled;
}

/**
 * Whether a heavy autoplaying asset — currently just the showroom clip — is
 * worth loading. Desktop tier only, and never on a metered or slow connection.
 */
export function useHeavyMediaAllowed(): boolean {
  return useMotionTier() === 'full';
}
