'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/lib/locale';
import { useFullMotion, useOnLoadMotion } from '@/lib/useMotionTier';
import { dealer } from '@/content/dealer';
import { telLink } from '@/lib/whatsapp';
import { Magnetic } from '@/components/motion/Magnetic';
import { HeroStage } from './HeroStage';

/** How far the photograph drifts against the page, in pixels, at full scroll. */
const PARALLAX_RANGE = 56;

/**
 * The first screen: the showroom itself, and the two things a visitor came for.
 *
 * Hard requirement, honoured: the headline and both CTAs are in the DOM and
 * visible before any animation runs. `useOnLoadMotion()` and `useFullMotion()`
 * both return false on the server and on first paint, so the exported HTML is
 * the finished hero. If JavaScript never arrives, the hero is complete and every
 * button works.
 *
 * Motion, by tier:
 *   every device — the headline, sub and buttons rise into place once, on load
 *   desktop only — the photograph drifts slowly against the scroll, and a soft
 *                  radial highlight follows the pointer across it
 *
 * The parallax is a transform on a single element, written from a rAF callback
 * that is scheduled at most once per frame and unbound when the hero leaves the
 * viewport. Nothing here can trigger layout.
 */
export function Hero() {
  const { copy } = useLocale();
  const full = useFullMotion();
  const arrive = useOnLoadMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  // Scroll parallax on the photograph. Desktop tier only.
  useEffect(() => {
    if (!full) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let bound = false;

    const measure = () => {
      frameRef.current = null;
      const height = section.offsetHeight || 1;
      const t = Math.min(1, Math.max(0, window.scrollY / height));
      stage.style.transform = `translate3d(0, ${(-t * PARALLAX_RANGE).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };

    // Bound to the scroller only while the hero is actually on screen.
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !bound) {
        window.addEventListener('scroll', onScroll, { passive: true });
        bound = true;
        measure();
      } else if (!visible && bound) {
        window.removeEventListener('scroll', onScroll);
        bound = false;
      }
    });
    observer.observe(section);

    return () => {
      observer.disconnect();
      if (bound) window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      stage.style.transform = '';
    };
  }, [full]);

  // The pointer highlight, written to a custom property so the paint stays on
  // the compositor and React never re-renders on mouse move.
  useEffect(() => {
    if (!full) return;
    const stage = stageRef.current;
    if (!stage) return;

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      stage.style.setProperty('--light-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      stage.style.setProperty('--light-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };
    const onLeave = () => {
      stage.style.setProperty('--light-x', '50%');
      stage.style.setProperty('--light-y', '38%');
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, [full]);

  const riseDelay = (ms: number): React.CSSProperties =>
    arrive ? ({ '--rise-delay': `${ms}ms` } as React.CSSProperties) : {};
  const rise = arrive ? 'hero-rise' : '';

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-section={copy.nav.home}
      className="section-ink relative overflow-hidden"
    >
      <div className="shell grid gap-10 py-14 md:py-20 xl:grid-cols-[1.05fr_1fr] xl:items-center xl:gap-16 xl:py-28">
        <div className="max-w-2xl">
          <p
            className={`eyebrow inline-flex items-center gap-2 text-tvsred-onink ${rise}`}
            style={riseDelay(0)}
          >
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-tvsred" />
            {copy.hero.eyebrow}
          </p>

          <h1
            className={`mt-4 text-[2.5rem] font-extrabold leading-[1.02] md:text-6xl xl:text-7xl ${rise}`}
            style={riseDelay(60)}
          >
            {copy.hero.headline}
          </h1>

          <p
            className={`mt-5 max-w-xl text-base leading-relaxed text-[color:var(--on-ink-muted)] md:text-lg ${rise}`}
            style={riseDelay(120)}
          >
            {copy.hero.sub}
          </p>

          <div className={`mt-8 flex flex-col gap-3 sm:flex-row ${rise}`} style={riseDelay(180)}>
            <Magnetic>
              <Link href="#enquiry" className="btn btn-primary w-full sm:w-auto">
                {copy.actions.bookTestRide}
              </Link>
            </Magnetic>
            <a href={telLink} className="btn btn-on-ink">
              {copy.actions.callNow} — <span className="tnum">{dealer.phoneDisplay}</span>
            </a>
          </div>
        </div>

        <div
          ref={stageRef}
          className="relative"
          style={{ '--light-x': '50%', '--light-y': '38%' } as React.CSSProperties}
        >
          <HeroStage />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{
              background:
                'radial-gradient(46% 46% at var(--light-x) var(--light-y), rgba(255,255,255,0.24), rgba(255,255,255,0) 70%)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
