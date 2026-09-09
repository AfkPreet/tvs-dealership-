'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { useAnyMotion } from '@/lib/useMotionTier';
import type { Vehicle } from '@/content/vehicles';
import { cardColour } from '@/content/vehicles';
import { VehiclePhoto } from './VehiclePhoto';

/**
 * The model page's showpiece: the bike in the colour you are choosing.
 *
 * Both photographs are in the DOM at once and the swap is an opacity crossfade
 * between two stacked layers, so nothing reflows, nothing flashes white, and the
 * outgoing colour is never a blank box. Under `prefers-reduced-motion` or a
 * metered connection the swap is instant instead.
 *
 * Colours without a photograph still get a swatch and still change the caption —
 * the stage falls back to the typeset plate rather than pretending the colour
 * does not exist.
 */
export function ColourStage({ vehicle }: { vehicle: Vehicle }) {
  const { copy } = useLocale();
  const animate = useAnyMotion();

  const initial = useMemo(() => {
    const preferred = cardColour(vehicle);
    return Math.max(0, vehicle.colours.indexOf(preferred));
  }, [vehicle]);

  const [index, setIndex] = useState(initial);
  // The layer currently fading out. Held for one transition, then dropped.
  const [previous, setPrevious] = useState<number | null>(null);

  useEffect(() => setIndex(initial), [initial]);

  useEffect(() => {
    if (previous === null) return;
    const id = window.setTimeout(() => setPrevious(null), 260);
    return () => window.clearTimeout(id);
  }, [previous]);

  const colour = vehicle.colours[index];

  function choose(next: number) {
    if (next === index) return;
    if (animate) setPrevious(index);
    setIndex(next);
  }

  /** A colour's own photo, else the model hero, so a stage is never empty. */
  const imageFor = (i: number) => vehicle.colours[i]?.image ?? vehicle.images.hero;

  return (
    <figure className="m-0">
      <div className="relative overflow-hidden rounded-sm bg-graphite">
        {/* The outgoing colour, fading out underneath. */}
        {previous !== null && previous !== index ? (
          <div className="absolute inset-0 colour-layer-out" aria-hidden="true">
            <VehiclePhoto vehicle={vehicle} src={imageFor(previous)} ratio="aspect-[4/3]" eager />
          </div>
        ) : null}

        <div className={previous !== null && animate ? 'colour-layer-in' : undefined}>
          <VehiclePhoto
            vehicle={vehicle}
            src={imageFor(index)}
            ratio="aspect-[4/3]"
            eager
            sizes="(min-width: 1280px) 44rem, 92vw"
          />
        </div>
      </div>

      <figcaption className="mt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="eyebrow text-[color:var(--on-ink-muted)]">{copy.model.colourLabel}</span>
          <span className="text-sm font-semibold text-white">{colour.name}</span>
        </div>

        {/* Radios, not buttons: this is a single choice from a named set, and
            arrow keys move between them the way a visitor expects. */}
        <div
          role="radiogroup"
          aria-label={`${copy.model.colourLabel} — ${vehicle.name}`}
          className="mt-3 flex flex-wrap gap-2.5"
        >
          {vehicle.colours.map((option, i) => (
            <button
              key={option.slug}
              type="button"
              role="radio"
              aria-checked={i === index}
              tabIndex={i === index ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                event.preventDefault();
                const step = event.key === 'ArrowRight' ? 1 : -1;
                const next = (i + step + vehicle.colours.length) % vehicle.colours.length;
                choose(next);
                (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
              }}
              className={`tap relative h-11 w-11 rounded-full border-2 transition-transform duration-200 active:scale-95 ${
                i === index ? 'border-white' : 'border-white/25 hover:border-white/60'
              }`}
              style={{
                background: `linear-gradient(135deg, ${option.hex} 0 52%, ${option.accentHex} 52% 100%)`,
              }}
            >
              <span className="sr-only">{option.name}</span>
            </button>
          ))}
        </div>
      </figcaption>

      {/* Extra views, where TVS publishes them. These are unnamed on purpose —
          the filenames that carry them do not reliably name a colour. */}
      {vehicle.images.gallery.length > 0 ? (
        <div className="mt-6">
          <p className="eyebrow text-[color:var(--on-ink-muted)]">{copy.model.galleryHeading}</p>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {vehicle.images.gallery.map((image) => (
              <li key={image} className="overflow-hidden rounded-sm bg-graphite">
                <img
                  src={image}
                  alt=""
                  width={1400}
                  height={840}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1280px) 10rem, 22vw"
                  className="aspect-[5/3] w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </figure>
  );
}
