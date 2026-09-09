'use client';

import { useEffect, useRef, useState } from 'react';
import { photos, showroomClip, src, srcSet } from '@/content/photos';
import { useHeavyMediaAllowed, useOnLoadMotion } from '@/lib/useMotionTier';

/**
 * The hero's picture: the dealership's own showroom, not a stock render.
 *
 * A portrait shot of the floor on phones and the wide shot of the Raider on
 * larger screens, chosen by `<picture>` so only one is ever downloaded. Both
 * carry width and height, so the hero's box is reserved before either arrives
 * and the headline beside it never jumps.
 *
 * On a wide screen that has not asked for reduced motion, a silent seven-second
 * pan across the floor fades in over the still once it has actually buffered. It
 * is never the LCP element — the still underneath is — and it is never fetched
 * at all on a phone, a metered connection, or under `prefers-reduced-motion`.
 */
export function HeroStage() {
  const wide = photos['hero-raider'];
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
    <div className="relative overflow-hidden rounded-sm bg-graphite">
      <picture>
        <source media="(min-width: 768px)" srcSet={srcSet('hero-raider')} sizes="(min-width: 1280px) 46rem, 92vw" />
        <source srcSet={srcSet('hero-floor')} sizes="92vw" />
        <img
          src={src('hero-raider')}
          alt={wide.alt}
          width={wide.width}
          height={wide.height}
          // The hero still is the LCP element on every viewport. Nothing defers it.
          fetchPriority="high"
          decoding="async"
          // The two sources have different shapes, so the ratio is a class, not an
          // inline style — an inline aspect-ratio would win against the md: rule
          // and leave the desktop photograph cropped to a phone's proportions.
          className={`aspect-[4/5] w-full object-cover md:aspect-[16/9] ${arrive ? 'hero-fade-rise' : ''}`}
          style={{
            backgroundImage: `url("${wide.blur}")`,
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

      {/* A red hairline along the bottom edge: the same rule the section
          headings draw, tying the photograph into the rest of the page. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[color:var(--tvs-red)]" />
    </div>
  );
}
