'use client';

import { useEffect, useRef, useState } from 'react';
import { photos, showroomClip, src, srcSet } from '@/content/photos';
import { useHeavyMediaAllowed, useOnLoadMotion } from '@/lib/useMotionTier';

/**
 * The hero's picture: the dealership's own showroom, not a stock render.
 *
 * Which photograph depends on the shape of the hole it has to fill.
 *
 * As a full-height panel down the side of a wide screen, the frame is tall and
 * narrow, and the wide Raider shot cropped into it becomes an unreadable
 * close-up of a fuel tank. The portrait shot of the floor is the right shape
 * for that, and it also reads as a showroom rather than as a bike.
 *
 * As a band under the copy, the wide shot is right and the portrait is not.
 * `<picture>` picks, so only one is ever downloaded, and both carry width and
 * height so nothing reflows around them.
 *
 * On a wide screen that has not asked for reduced motion, a silent seven-second
 * pan across the floor fades in over the still once it has actually buffered. It
 * is never the LCP element — the still underneath is — and it is never fetched
 * at all on a phone, a metered connection, or under `prefers-reduced-motion`.
 */
export function HeroStage() {
  const tall = photos['hero-floor'];
  const allowVideo = useHeavyMediaAllowed();
  const arrive = useOnLoadMotion();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!allowVideo || !showroomClip) return;
    const node = videoRef.current;
    if (!node) return;

    // Only start buffering once the hero is actually on screen, so a visitor who
    // lands deep-linked further down the page never pays for it.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        node.preload = 'auto';
        node.load();
        void node.play().catch(() => {
          // Autoplay refused (some battery-saver modes). The still stays; no error state.
        });
      },
      { rootMargin: '0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [allowVideo]);

  return (
    <div className="relative h-full overflow-hidden bg-graphite">
      {/*
        Exactly one of these matches at any width, so exactly one file is ever
        downloaded — which is the whole reason this is a <picture> and not two
        elements with one of them hidden. A `display: none` image is still
        fetched by the browser, so the earlier two-element version had a phone
        pulling both photographs.

        Portrait on a phone, wide from md, portrait again from xl where the
        photograph becomes a tall panel down the side.
      */}
      <picture>
        <source media="(min-width: 1280px)" srcSet={srcSet('hero-floor')} sizes="46vw" />
        <source media="(min-width: 768px)" srcSet={srcSet('hero-raider')} sizes="92vw" />
        <img
          src={src('hero-floor')}
          alt={tall.alt}
          width={tall.width}
          height={tall.height}
          // The hero still is the LCP element on every viewport. Nothing defers it.
          fetchPriority="high"
          decoding="async"
          // The two sources have different shapes, so the ratio is a class, not an
          // inline style — an inline aspect-ratio would win against the md: rule
          // and leave the desktop photograph cropped to a phone's proportions.
          className={`aspect-[4/5] w-full object-cover md:aspect-[16/9] xl:aspect-auto xl:h-full ${
            arrive ? 'hero-fade-rise' : ''
          }`}
          style={{
            backgroundImage: `url("${tall.blur}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </picture>

      {allowVideo && showroomClip ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster={showroomClip.poster}
          width={showroomClip.width}
          height={showroomClip.height}
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={showroomClip.src} type="video/mp4" />
        </video>
      ) : null}

      {/* A red hairline: along the bottom when the photograph is a band, down
          the leading edge when it is a full-height panel. Either way it is the
          same rule the section headings draw. */}
      {/* A red rule along the bottom of the band, down the leading edge of the
          tall panel. The same hairline the section headings draw. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[color:var(--tvs-red)] xl:inset-y-0 xl:left-0 xl:right-auto xl:h-auto xl:w-[3px]"
      />
    </div>
  );
}
