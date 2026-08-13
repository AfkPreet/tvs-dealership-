'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { useReducedExperience } from '@/lib/useReducedExperience';

/**
 * The desktop-only motion layer: smooth scroll, the scroll progress rail, and
 * the page transition wipe.
 *
 * All three are gated behind `useReducedExperience()`, so they exist only above
 * 1280px on a fast connection with motion allowed. Nothing here renders any
 * content — if the whole layer fails to mount, the site is unchanged.
 */
export function DesktopMotionLayer() {
  const reduced = useReducedExperience();

  if (reduced) return null;

  return (
    <>
      <SmoothScroll />
      <ScrollRail />
      <PageWipe />
    </>
  );
}

/* ------------------------------------------------------------------ */

const LERP = 0.14;

/**
 * Lenis-style smooth scroll with a short easing.
 *
 * The rAF loop starts on a wheel event and stops the moment the distance closes,
 * so nothing runs while the page is idle. Keyboard, touch and anchor scrolling
 * are left entirely alone — only the wheel is eased.
 */
function SmoothScroll() {
  useEffect(() => {
    let target = window.scrollY;
    let current = window.scrollY;
    let frame: number | null = null;
    let running = false;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const tick = () => {
      current += (target - current) * LERP;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        running = false;
        frame = null;
        return;
      }
      window.scrollTo(0, current);
      frame = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      // Leave pinch-zoom, trackpad horizontal swipes and modified scrolls alone.
      if (event.ctrlKey || event.deltaMode !== 0) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (!running) current = window.scrollY;
      target = Math.min(maxScroll(), Math.max(0, target + event.deltaY));
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };

    // Any scroll we did not drive — keyboard, scrollbar drag, anchor jump —
    // resets the target so the next wheel event continues from the real position.
    const onScroll = () => {
      if (!running) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/* ------------------------------------------------------------------ */

type Section = { id: string; label: string; top: number };

/**
 * A hairline rail down the left edge that doubles as section navigation.
 * Sections are discovered from `[data-section]` markers in the page itself, so
 * pages do not have to register anything.
 */
function ScrollRail() {
  const { copy } = useLocale();
  const pathname = usePathname();
  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
      setSections(
        nodes.map((node) => ({
          id: node.id,
          label: node.dataset.section ?? node.id,
          top: node.offsetTop,
        })),
      );
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pathname]);

  useEffect(() => {
    if (sections.length === 0) return;

    const update = () => {
      frameRef.current = null;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / max)));

      const marker = window.scrollY + window.innerHeight * 0.35;
      let index = 0;
      for (let i = 0; i < sections.length; i += 1) {
        if (sections[i].top <= marker) index = i;
      }
      setActive(index);
    };

    const onScroll = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label={copy.a11y.progressRail}
      className="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <div className="relative flex flex-col items-center gap-4">
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/15" />
        <span
          aria-hidden
          className="absolute left-1/2 top-0 h-full w-px origin-top -translate-x-1/2 bg-tvsred transition-transform duration-150 ease-out"
          style={{ transform: `translateX(-50%) scaleY(${progress})` }}
        />
        {sections.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="group relative flex items-center"
            aria-current={index === active ? 'true' : undefined}
          >
            <span
              aria-hidden
              className={`block h-2 w-2 rounded-full border transition-all duration-300 ${
                index === active
                  ? 'scale-125 border-tvsred bg-tvsred'
                  : 'border-white/40 bg-ink group-hover:border-white'
              }`}
            />
            <span className="pointer-events-none absolute left-5 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {section.label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */

/**
 * A brief red wipe between routes. Well under 400ms — long enough to register
 * as a transition, short enough that it never reads as waiting.
 */
function PageWipe() {
  const pathname = usePathname();
  const [run, setRun] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setRun((n) => n + 1);
  }, [pathname]);

  if (run === 0) return null;

  return (
    // Keyed so each navigation restarts the sweep from the beginning. The panel
    // crosses the viewport in 360ms and covers it fully only in passing.
    <div key={run} aria-hidden className="page-wipe pointer-events-none fixed inset-0 z-50 bg-tvsred" />
  );
}
