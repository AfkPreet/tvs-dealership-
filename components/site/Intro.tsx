'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';

const HOLD_MS = 620;
const FADE_MS = 340;
const SESSION_KEY = 'skm-intro-shown';

/**
 * The opening title card.
 *
 * A solid ink panel with the showroom's name drawing in behind a red rule that
 * sweeps across it, then it fades and is removed from the DOM entirely. Roughly
 * a second, once per browser session.
 *
 * Three things keep it from costing anything that matters:
 *
 *   It is client-only and mounts after hydration, so the exported HTML — and
 *   therefore the crawler, and a visitor whose JavaScript fails — never contains
 *   it. The page underneath has already painted before the panel appears.
 *
 *   It is `position: fixed` with a flat background and no image, so it is not a
 *   candidate for Largest Contentful Paint. The hero photograph underneath still
 *   loads, still paints, and still gets measured on its own schedule.
 *
 *   It is skipped outright under `prefers-reduced-motion`, on a second page view
 *   in the same session, and the moment anyone presses a key, taps, or scrolls.
 *
 * `aria-hidden`, `inert` and `pointer-events-none` together mean it is invisible
 * to assistive technology and cannot swallow a tap meant for the page beneath.
 */
export function Intro() {
  const { copy } = useLocale();
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>('hidden');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Private mode with storage disabled. Showing it once more is harmless.
    }

    setPhase('in');

    let removeTimer = 0;
    const leave = () => {
      setPhase('out');
      removeTimer = window.setTimeout(() => setPhase('hidden'), FADE_MS);
    };

    const holdTimer = window.setTimeout(leave, HOLD_MS);

    // Any intent to interact ends it early — nobody should ever wait on this.
    const skip = () => {
      window.clearTimeout(holdTimer);
      leave();
    };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('wheel', skip, { once: true, passive: true });

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(removeTimer);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      aria-hidden="true"
      // @ts-expect-error — `inert` is valid HTML that React 19 forwards verbatim.
      inert=""
      className={`intro ${phase === 'out' ? 'intro-out' : ''}`}
      data-intro
    >
      <div className="intro-mark">
        <span className="intro-name font-display">{dealer.name}</span>
        <span aria-hidden="true" className="intro-rule" />
        <span className="intro-sub">{copy.footer.tagline}</span>
      </div>
    </div>
  );
}
