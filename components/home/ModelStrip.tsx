'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import { byRank, priceFrom } from '@/content/vehicles';
import { formatINR } from '@/lib/format';
import { VehiclePhoto } from '@/components/vehicles/VehiclePhoto';
import { Reveal } from '@/components/motion/Reveal';

/**
 * Every model the showroom sells, in one pass.
 *
 * A horizontally scrolling rail on a phone and a grid on a wide screen, from the
 * same markup: the range is the point now, and a visitor should be able to see
 * its whole shape without a page change. Scroll snapping makes the rail land on
 * a card rather than halfway between two.
 *
 * The rail is a list of links, so it is keyboard- and screen-reader-navigable
 * without any of the carousel machinery that usually comes with this shape —
 * no autoplay, no dots, nothing bound to a timer.
 */
export function ModelStrip() {
  const { copy } = useLocale();

  return (
    <section id="range" data-section={copy.range.heading} className="section-ink">
      <div className="py-16 xl:py-24">
        <div className="shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="rail-heading text-3xl font-extrabold md:text-4xl xl:text-5xl">
                  {copy.range.heading}
                </h2>
                <p className="mt-3 text-[color:var(--on-ink-muted)]">{copy.range.sub}</p>
              </div>
              <p className="tnum eyebrow text-[color:var(--on-ink-muted)]">
                {copy.range.countLabel(byRank.length)}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Full-bleed on a phone so the rail runs to both edges and reads as
            scrollable; constrained back to the shell from `md` up. */}
        <ul className="model-rail mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,calc((100vw-80rem)/2))] pb-4 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:px-[max(1.25rem,calc((100vw-80rem)/2))] xl:grid-cols-4">
          {byRank.map((vehicle, index) => (
            <li
              key={vehicle.slug}
              className="w-[15.5rem] shrink-0 snap-start md:w-auto"
              style={{ '--reveal-delay': `${Math.min(index, 8) * 40}ms` } as React.CSSProperties}
            >
              <Link
                href={`/vehicles/${vehicle.slug}`}
                className="tap group flex h-full flex-col overflow-hidden rounded-sm border border-white/12 bg-graphite transition-[transform,border-color] duration-300 hover:border-white/30 active:scale-[0.985] xl:hover:-translate-y-1"
              >
                <VehiclePhoto
                  vehicle={vehicle}
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
