'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { useOnLoadMotion, useReducedExperience } from '@/lib/useReducedExperience';
import { dealer } from '@/content/dealer';
import { telLink } from '@/lib/whatsapp';
import { Magnetic } from '@/components/motion/Magnetic';
import { HeroVehicle, type HeroLayer } from './HeroVehicle';

/**
 * Showpiece B — the scroll-driven hero reveal.
 *
 * Desktop: the vehicle assembles as the first viewport scrolls, with a subtle
 * parallax between layers and a soft radial highlight that tracks the pointer,
 * so the machine reads as a lit object in a dark showroom.
 *
 * Mobile: a single fade-and-rise on load. No scroll binding at all —
 * scroll-jacking on a phone is a conversion killer and does not ship here.
 *
 * Hard requirement, honoured: the headline and the primary CTA are in the DOM
 * and visible before any animation runs. `useReducedExperience()` returns true
 * on the server and on first paint, so the exported HTML is the finished hero.
 * If JavaScript never arrives, the hero is complete and every button works.
 */
export function Hero() {
  const { copy } = useLocale();
  const reduced = useReducedExperience();
  const arrive = useOnLoadMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const frameRef = useRef<number | null>(null);

  // The assembly also runs on load, so a visitor who lands and does not scroll
  // still sees the vehicle come together — and sees a complete machine within a
  // second. Scrolling simply drives it to the same finished state faster.
  const loadProgress = useRef(0);
  const scrollProgress = useRef(0);

  // Scroll binding — desktop only, and only while the hero is on screen.
  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    const node = sectionRef.current;
    if (!node) return;

    let bound = false;

    const measure = () => {
      frameRef.current = null;
      const height = node.offsetHeight || 1;
      const scrolled = Math.min(height, Math.max(0, window.scrollY));
      scrollProgress.current = (scrolled / height) * 1.8;
      setProgress(Math.min(1, Math.max(loadProgress.current, scrollProgress.current)));
    };

    // A short self-running ramp, cancelled as soon as it reaches the end.
    const started = performance.now();
    let ramp: number | null = requestAnimationFrame(function step(now) {
      loadProgress.current = Math.min(1, (now - started) / 1100);
      setProgress(Math.min(1, Math.max(loadProgress.current, scrollProgress.current)));
      ramp = loadProgress.current < 1 ? requestAnimationFrame(step) : null;
    });

    const onScroll = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(measure);
    };

    // Nothing stays bound to the scroller once the hero has left the viewport.
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

    observer.observe(node);
    measure();

    return () => {
      observer.disconnect();
      if (bound) window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (ramp !== null) cancelAnimationFrame(ramp);
    };
  }, [reduced]);

  /* Cursor-reactive lighting: a radial-gradient position, nothing more. */
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    const node = stageRef.current;
    if (!node) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    let queued: number | null = null;
    let x = 50;
    let y = 40;

    const apply = () => {
      queued = null;
      node.style.setProperty('--light-x', `${x}%`);
      node.style.setProperty('--light-y', `${y}%`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width) * 100;
      y = ((event.clientY - rect.top) / rect.height) * 100;
      if (queued === null) queued = requestAnimationFrame(apply);
    };

    node.addEventListener('pointermove', onMove);
    return () => {
      node.removeEventListener('pointermove', onMove);
      if (queued !== null) cancelAnimationFrame(queued);
    };
  }, [reduced]);

  /**
   * Each layer settles from its own offset, in one consistent direction, at a
   * slightly different rate — that difference is the parallax.
   */
  const layerStyle = useCallback(
    (layer: HeroLayer): React.CSSProperties => {
      if (reduced) return {};

      const config: Record<HeroLayer, { delay: number; x: number; y: number }> = {
        wheels: { delay: 0, x: 0, y: 46 },
        under: { delay: 0.08, x: -40, y: 22 },
        rear: { delay: 0.16, x: -64, y: 14 },
        apron: { delay: 0.24, x: 72, y: 14 },
        seat: { delay: 0.34, x: -28, y: -34 },
        accent: { delay: 0.44, x: 40, y: -12 },
      };

      const { delay, x, y } = config[layer];
      const t = Math.min(1, Math.max(0, (progress - delay) / 0.4));
      const eased = 1 - Math.pow(1 - t, 3);

      return {
        opacity: eased,
        transform: `translate3d(${(1 - eased) * x}px, ${(1 - eased) * y}px, 0)`,
        transition: 'opacity 120ms linear',
        willChange: 'transform, opacity',
      };
    },
    [progress, reduced],
  );

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

          <div
            className={`mt-8 flex flex-col gap-3 sm:flex-row ${rise}`}
            style={riseDelay(180)}
          >
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
          style={
            {
              '--light-x': '50%',
              '--light-y': '38%',
            } as React.CSSProperties
          }
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              background:
                'radial-gradient(46% 46% at var(--light-x) var(--light-y), rgba(255,255,255,0.14), rgba(255,255,255,0) 70%)',
            }}
          />
          <div className={arrive ? 'hero-fade-rise' : ''} style={riseDelay(120)}>
            <HeroVehicle layerStyle={layerStyle} />
          </div>
          <p className="mt-2 text-center text-[11px] text-[color:var(--on-ink-muted)]">{copy.preview.line}</p>
        </div>
      </div>
    </section>
  );
}
