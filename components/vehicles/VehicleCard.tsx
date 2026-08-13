'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useLocalised } from '@/lib/locale';
import { cardColour, heroPath, priceFrom, type Vehicle } from '@/content/vehicles';
import { formatINR } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';

export function VehicleCard({
  vehicle,
  eager = false,
  // On /vehicles the cards sit directly under the page <h1>; on the homepage
  // they sit under a section <h2>. Hard-coding the tag breaks heading order on
  // one of the two, so the page says which level it is.
  headingLevel = 3,
}: {
  vehicle: Vehicle;
  eager?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const { copy, locale } = useLocale();
  const t = useLocalised();
  const pathname = usePathname();

  const from = priceFrom(vehicle);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-sm border border-rule bg-white transition-[transform,box-shadow] duration-300 hover:xl:-translate-y-1">
      {/* Not a link: the title's full-bleed ::after overlay already makes the
          whole card clickable, and a second nameless link is a screen-reader tax. */}
      <div className="block bg-ink">
        <img
          src={heroPath(vehicle.slug, cardColour(vehicle).slug)}
          alt=""
          width={2000}
          height={1200}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-[5/3] w-full object-cover transition-transform duration-500 group-hover:xl:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-[color:var(--ink-muted)]">{copy.categories[vehicle.category]}</p>

        <Heading className="mt-1.5 font-display text-xl font-bold tracking-tightest">
          {/* The ::after overlay makes the whole card the hit area. */}
          <Link
            href={`/vehicles/${vehicle.slug}`}
            data-card-link
            className="after:absolute after:inset-0 after:content-['']"
          >
            {vehicle.name}
          </Link>
        </Heading>

        <p className="mt-1.5 text-sm leading-snug text-[color:var(--ink-muted)]">{t(vehicle.tagline)}</p>

        <dl className="mt-4 border-t border-rule pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-[color:var(--ink-muted)]">
              {copy.models.priceFrom} · {copy.models.exShowroom}
            </dt>
            <dd className="tnum font-display text-lg font-bold tracking-tightest">{formatINR(from)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <dt className="text-xs text-[color:var(--ink-muted)]">{copy.models.onRoadFrom}</dt>
            <dd className="tnum text-sm font-semibold text-tvsred-onlight">{formatINR(vehicle.onRoad.total)}</dd>
          </div>
        </dl>

        {/* Sits above the card-wide link overlay so it stays independently clickable. */}
        <a
          href={whatsappLink({ kind: 'price', model: vehicle.name, sourcePath: pathname, locale })}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary relative z-10 mt-5 w-full"
        >
          {copy.actions.getOnRoadPrice}
        </a>
      </div>
    </article>
  );
}
