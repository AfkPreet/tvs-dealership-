'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { byRank, priceFrom } from '@/content/vehicles';
import { formatINR } from '@/lib/format';
import { VehiclePhoto } from '@/components/vehicles/VehiclePhoto';

/**
 * Every model the showroom sells, in one pass.
 *
 * A horizontally scrolling rail at every width. Nineteen models as a four-across
 * grid is five rows deep and reads as a catalogue; as one row that runs off the
 * edge it reads as a range, which is the point.
 *
 * The rail is a list of links, so it is keyboard- and screen-reader-navigable
 * without any of the carousel machinery that usually comes with this shape —
 * no autoplay, no dots, nothing bound to a timer. Arrow buttons appear where
 * there is a pointer to use them, and they are hidden from assistive technology
 * because tabbing through the links already does the same job better.
 */
export function ModelStrip() {
  const { copy } = useLocale();
  const railRef = useRef<HTMLUListElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Which arrows to show. Read from the scroller on scroll and on resize, and
  // never in a way that can move the rail on its own.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      setAtStart(rail.scrollLeft <= 8);
      setAtEnd(rail.scrollLeft >= max - 8);
    };
    update();

    rail.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => {
      rail.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  const nudge = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    // Roughly one screen of cards, so a click always lands on a new set.
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id="range" data-section={copy.range.heading} className="section-ink">
      <div className="py-12 md:py-14 xl:py-20">
        <div className="shell">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="rail-heading text-3xl font-extrabold md:text-4xl xl:text-5xl">
                  {copy.range.heading}
                </h2>
                <p className="mt-3 text-[color:var(--on-ink-muted)]">{copy.range.sub}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="tnum eyebrow text-[color:var(--on-ink-muted)]">
                  {copy.range.countLabel(byRank.length)}
                </p>
                {/* Pointer affordance only. Keyboard users tab the links, screen
                    readers read the list; neither needs these. */}
                <div aria-hidden className="hidden gap-2 xl:flex">
                  {([-1, 1] as const).map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      tabIndex={-1}
                      onClick={() => nudge(direction)}
                      disabled={direction === -1 ? atStart : atEnd}
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 text-white transition-[opacity,border-color] duration-200 hover:border-white/50 disabled:pointer-events-none disabled:opacity-25"
                    >
                      {direction === -1 ? '←' : '→'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-bleed on a phone so the rail runs to both edges and reads as
            scrollable; constrained back to the shell from `md` up. */}
        {/* Full-bleed at every width so the rail runs to both edges and reads as
            scrollable. The padding lines the first card up with the shell. */}
        <ul
          ref={railRef}
          className="model-rail mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,calc((100vw-80rem)/2))] pb-4"
        >
          {byRank.map((vehicle) => (
            <li key={vehicle.slug} className="w-[15.5rem] shrink-0 snap-start md:w-[17rem]">
              <Link
                href={`/vehicles/${vehicle.slug}`}
                className="tap group flex h-full flex-col overflow-hidden rounded-sm border border-white/12 bg-graphite transition-[transform,border-color] duration-300 hover:border-white/30 active:scale-[0.985] xl:hover:-translate-y-1"
              >
                <VehiclePhoto
                  vehicle={vehicle}
                  // Lazy, all nineteen. Loading the first few eagerly looked
                  // right in a screenshot and cost two points of mobile
                  // Performance for images that sit far below the fold on a
                  // phone. The blank card that prompted it was the screenshot
                  // firing before the image arrived, not a bug.
                  ratio="aspect-[4/3]"
                  sizes="(min-width: 1280px) 18rem, (min-width: 768px) 30vw, 15.5rem"
                  className="transition-transform duration-500 xl:group-hover:scale-[1.04]"
                />
                <div className="flex flex-1 flex-col p-4">
                  <p className="eyebrow text-[color:var(--on-ink-muted)]">
                    {copy.categories[vehicle.category]}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold leading-tight tracking-tightest text-white">
                    {vehicle.name}
                  </p>
                  <p className="tnum mt-auto pt-3 text-sm text-[color:var(--on-ink-muted)]">
                    {copy.models.priceFrom} {formatINR(priceFrom(vehicle))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
