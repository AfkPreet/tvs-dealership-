'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { framePath, TOTAL_FRAMES, REDUCED_FRAME_STEP, type ColourOption } from '@/content/vehicles';

type Props = {
  slug: string;
  name: string;
  colours: ColourOption[];
};

type Plan = { step: number; sequence: boolean };

function readPlan(): Plan {
  if (typeof window === 'undefined') return { step: REDUCED_FRAME_STEP, sequence: false };

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;

  // Data Saver or a 2G connection: one static image plus the colour swatches.
  // The colour decision still works; we simply do not spend 12 more requests on
  // a rotation the rider will not wait for.
  if (connection?.saveData || connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    return { step: REDUCED_FRAME_STEP, sequence: false };
  }

  // Desktop gets all 36 frames; phones get every third — a third of the bytes
  // for a rotation that still reads as continuous under a thumb.
  return { step: window.innerWidth >= 1280 ? 1 : REDUCED_FRAME_STEP, sequence: true };
}

/**
 * 360° colour spinner.
 *
 * Feels three-dimensional; is only images — no WebGL, no 3D pipeline. It earns
 * its weight because colour is a real decision point for a two-wheeler buyer,
 * and this is the moment that most justifies the bytes.
 *
 * Nothing is fetched until the component scrolls into view, so it never blocks
 * first paint. The first frame is the only eager request; the rest arrive
 * progressively behind a thin progress bar.
 */
export function Spinner360({ slug, name, colours }: Props) {
  const { copy } = useLocale();
  const [colour, setColour] = useState(colours[0]);
  const [plan, setPlan] = useState<Plan>({ step: REDUCED_FRAME_STEP, sequence: false });
  const [inView, setInView] = useState(false);
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const [touched, setTouched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; lastX: number; accumulated: number }>({
    active: false,
    lastX: 0,
    accumulated: 0,
  });

  const frames = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i += plan.step) list.push(i);
    return list;
  }, [plan.step]);

  useEffect(() => setPlan(readPlan()), []);

  // Nothing loads until the spinner is actually on screen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Progressive fetch of the remaining frames for the active colour.
  useEffect(() => {
    if (!inView || !plan.sequence) return;
    setLoaded(new Set([0]));

    let cancelled = false;
    const images: HTMLImageElement[] = [];

    const fetchNext = (index: number) => {
      if (cancelled || index >= frames.length) return;
      const image = new Image();
      images.push(image);
      image.onload = image.onerror = () => {
        if (cancelled) return;
        setLoaded((prev) => new Set(prev).add(frames[index]));
        fetchNext(index + 1);
      };
      image.src = framePath(slug, colour.slug, frames[index]);
    };

    fetchNext(1);

    return () => {
      cancelled = true;
      // Detach handlers so an in-flight decode cannot touch state after unmount.
      for (const image of images) image.onload = image.onerror = null;
    };
  }, [inView, plan.sequence, frames, slug, colour.slug]);

  // While frames are still arriving, show the nearest one we actually have.
  const visibleFrame = useMemo(() => {
    if (loaded.has(frame)) return frame;
    let best = 0;
    let bestDistance = Infinity;
    for (const candidate of loaded) {
      const distance = Math.abs(candidate - frame);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    return best;
  }, [frame, loaded]);

  const advance = useCallback(
    (steps: number) => {
      if (steps === 0) return;
      setFrame((current) => {
        const positions = frames.length;
        const currentIndex = frames.indexOf(current);
        const base = currentIndex === -1 ? 0 : currentIndex;
        const next = (((base + steps) % positions) + positions) % positions;
        return frames[next];
      });
    },
    [frames],
  );

  /* --- Pointer drag: one handler serves mouse, pen and touch alike. --- */

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!plan.sequence) return;
    dragRef.current = { active: true, lastX: event.clientX, accumulated: 0 };
    setTouched(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    const width = event.currentTarget.clientWidth || 1;
    // One full drag across the component is roughly one full revolution.
    const pixelsPerFrame = width / frames.length;
    drag.accumulated += event.clientX - drag.lastX;
    drag.lastX = event.clientX;

    const steps = Math.trunc(drag.accumulated / pixelsPerFrame);
    if (steps !== 0) {
      drag.accumulated -= steps * pixelsPerFrame;
      advance(-steps);
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /* --- Desktop wheel: horizontal only. Vertical still scrolls the page,
         because trapping the wheel over a component is a good way to make a
         visitor feel stuck. --- */
  useEffect(() => {
    const node = containerRef.current;
    if (!node || !plan.sequence) return;

    let accumulated = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && !event.shiftKey) return;
      event.preventDefault();
      setTouched(true);
      accumulated += event.shiftKey ? event.deltaY : event.deltaX;
      const steps = Math.trunc(accumulated / 24);
      if (steps !== 0) {
        accumulated -= steps * 24;
        advance(steps);
      }
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [plan.sequence, advance]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      advance(1);
      setTouched(true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      advance(-1);
      setTouched(true);
    }
  };

  const progress = plan.sequence ? loaded.size / frames.length : 1;
  const degrees = Math.round((visibleFrame / TOTAL_FRAMES) * 360);

  return (
    <div className="select-none">
      <div
        ref={containerRef}
        role="img"
        aria-label={copy.model.spinnerAlt(name, colour.name, degrees)}
        tabIndex={plan.sequence ? 0 : -1}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`relative aspect-[5/3] w-full overflow-hidden rounded-sm bg-ink ${
          plan.sequence ? 'cursor-ew-resize touch-pan-y' : ''
        }`}
      >
        <img
          src={framePath(slug, colour.slug, visibleFrame)}
          alt=""
          width={2000}
          height={1200}
          // The first frame of the first colour is the only eager request.
          loading={visibleFrame === 0 && colour.slug === colours[0].slug ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />

        {plan.sequence && progress < 1 ? (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-tvsred transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
            <span className="sr-only">{copy.model.spinnerLoading}</span>
          </div>
        ) : null}

        {plan.sequence && !touched ? (
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
            <span className="hidden xl:inline">{copy.model.spinnerHint}</span>
            <span className="xl:hidden">{copy.model.spinnerHintTouch}</span>
          </p>
        ) : null}
      </div>

      <fieldset className="mt-4">
        <legend className="eyebrow text-[color:var(--on-ink-muted)]">{copy.model.colourLabel}</legend>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {colours.map((option) => {
            const active = option.slug === colour.slug;
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => {
                  setColour(option);
                  setFrame(0);
                }}
                aria-pressed={active}
                className={`tap flex items-center gap-2.5 rounded-sm border px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/20 text-[color:var(--on-ink-muted)] hover:border-white/50 hover:text-white'
                }`}
              >
                <span
                  aria-hidden
                  className="h-5 w-5 shrink-0 rounded-full border border-white/30"
                  style={{ background: `linear-gradient(135deg, ${option.hex} 55%, ${option.accentHex} 55%)` }}
                />
                {option.name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
