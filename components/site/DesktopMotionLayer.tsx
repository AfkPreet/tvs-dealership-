'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { useFullMotion } from '@/lib/useMotionTier';

/**
 * The scroll progress rail, and nothing else any more.
 *
 * This used to also ease the mouse wheel and wipe a red panel across the screen
 * on every navigation. Both are gone: the wipe played on arrival, which is the
 * one thing motion on this site is not for, and easing the wheel takes the
 * scroll away from the person doing the scrolling.
 *
 * What is left is a position indicator, not an animation. It is gated behind
 * `useFullMotion()`, so it exists only above 1280px with motion allowed, and it
 * renders no content — if it fails to mount, the site is unchanged.
 */
export function DesktopMotionLayer() {
  const reduced = !useFullMotion();

  if (reduced) return null;

  return <ScrollRail />;
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

