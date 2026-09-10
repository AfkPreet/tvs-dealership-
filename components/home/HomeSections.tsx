'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import { featuredVehicles, byRank } from '@/content/vehicles';
import { dealer, addressOneLine, hasFacility } from '@/content/dealer';
import { photos, src, srcSet } from '@/content/photos';
import { EMI_DEFAULTS, indicativeEmi } from '@/lib/emi';
import { formatINR, formatTime } from '@/lib/format';
import { telLink } from '@/lib/whatsapp';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { PriceSheet } from '@/components/vehicles/PriceSheet';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { OpeningHours } from '@/components/site/OpeningHours';
import { Magnetic } from '@/components/motion/Magnetic';

/* ------------------------------------------------------------------ */

export function ModelShortlist() {
  const { copy } = useLocale();

  return (
    <section id="models" data-section={copy.models.heading} className="section-light">
      <div className="shell py-12 md:py-14 xl:py-20">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.models.heading}</h2>
              <p className="mt-3 text-[color:var(--ink-muted)]">{copy.models.sub}</p>
            </div>
            <Link href="/vehicles" className="btn btn-secondary">
              {copy.actions.viewAll}
            </Link>
          </div>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:mt-10 md:grid-cols-3">
          {featuredVehicles.map((vehicle, index) => (
            <li key={vehicle.slug}>
              <VehicleCard vehicle={vehicle} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function EmiTeaser() {
  const { copy } = useLocale();

  // Three real models, three real monthly figures — computed from the same
  // reducing-balance function the full calculator uses, so they can never drift.
  const chips = byRank.slice(0, 3).map((vehicle) => ({
    slug: vehicle.slug,
    name: vehicle.name,
    emi: indicativeEmi(vehicle.onRoad.total),
  }));

  const cheapest = Math.min(...byRank.map((v) => indicativeEmi(v.onRoad.total)));

  return (
    <section id="emi" data-section={copy.emiTeaser.heading} className="section-ink">
      <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:items-center xl:py-20">
        <div>
          <p className="eyebrow text-tvsred-onink">
            {copy.emiTeaser.chipLabel} {formatINR(cheapest)}
            {copy.emiTeaser.perMonth}
          </p>
          <h2 className="mt-4 max-w-xl text-3xl font-extrabold md:text-4xl xl:text-5xl">
            {copy.emiTeaser.heading}
          </h2>
          <p className="mt-4 max-w-lg text-[color:var(--on-ink-muted)]">{copy.emiTeaser.sub}</p>
          <Magnetic className="mt-8">
            <Link href="/finance" className="btn btn-primary">
              {copy.emiTeaser.cta}
            </Link>
          </Magnetic>
        </div>

        <div>
          <ul className="grid gap-3">
            {chips.map((chip) => (
              <li key={chip.slug}>
                <Link
                  href={`/vehicles/${chip.slug}`}
                  className="flex items-center justify-between gap-4 rounded-sm border border-white/15 bg-graphite px-5 py-4 transition-colors hover:border-white/40"
                >
                  <span className="font-medium">{chip.name}</span>
                  <span className="tnum shrink-0 font-display text-xl font-bold tracking-tightest text-tvsred-onink">
                    {formatINR(chip.emi)}
                    <span className="text-sm font-medium text-[color:var(--on-ink-muted)]">
                      {copy.emiTeaser.perMonth}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[color:var(--on-ink-muted)]">
            {EMI_DEFAULTS.months} {copy.finance.months} · {EMI_DEFAULTS.annualRate}% · 20%{' '}
            {copy.finance.downPayment}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function WhyBuyHere() {
  const { copy } = useLocale();

  return (
    <section id="why" data-section={copy.why.heading} className="section-mist">
      <div className="shell py-12 md:py-14 xl:py-20">
        <div>
          <h2 className="max-w-3xl text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.why.heading}</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ink-muted)]">{copy.why.sub}</p>
        </div>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-2 xl:grid-cols-3">
          {copy.why.items.filter((item) => hasFacility(item.requires)).map((item, index) => (
            <li key={item.title} className="bg-white p-6 xl:p-8">
              <p className="flex items-center gap-2 font-semibold">
                <span aria-hidden className="text-verified">
                  ✓
                </span>
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-muted)]">{item.body}</p>
            </li>
          ))}
        </ul>

        {/* The price sheet appears in miniature here, using a real model. */}
        <div>
          {/* Top-aligned, and the left column now carries what each line of the
              breakdown actually is. It used to hold a heading and one sentence
              vertically centred against a tall card, which left most of the
              section as blank paper. */}
          <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_420px] xl:items-start xl:gap-12">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl font-bold tracking-tightest xl:text-3xl">
                {copy.model.onRoadHeading}
              </h3>
              <p className="mt-3 text-[color:var(--ink-muted)]">{copy.model.onRoadSub}</p>

              <dl className="mt-7 space-y-4 border-t border-rule pt-6">
                {copy.model.onRoadWhy.map((item) => (
                  <div key={item.term} className="grid gap-1 md:grid-cols-[9rem_1fr] md:gap-4">
                    <dt className="font-semibold">{item.term}</dt>
                    <dd className="text-[15px] leading-relaxed text-[color:var(--ink-muted)]">
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <PriceSheet
              onRoad={byRank[0].onRoad}
              variant="mini"
              vehicleName={byRank[0].name}
              href={`/vehicles/${byRank[0].slug}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function LocationSection() {
  const { copy } = useLocale();

  return (
    <section id="location" data-section={copy.location.heading} className="section-light">
      <div className="shell py-12 md:py-14 xl:py-20">
        <div>
          <h2 className="max-w-2xl text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.location.heading}</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ink-muted)]">{copy.location.sub}</p>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_1.15fr]">
          <div>
            <dl className="rounded-sm border border-rule">
              <div className="border-b border-rule p-5">
                <dt className="eyebrow text-[color:var(--ink-muted)]">{copy.location.addressLabel}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed">
                  {addressOneLine}
                  <a
                    href={dealer.mapDirections}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary mt-4 w-full"
                  >
                    {copy.actions.directions}
                  </a>
                </dd>
              </div>

              <div className="border-b border-rule p-5">
                <dt className="eyebrow text-[color:var(--ink-muted)]">{copy.location.phoneLabel}</dt>
                <dd className="mt-2">
                  <a href={telLink} className="tnum text-lg font-semibold hover:text-tvsred-onlight">
                    {dealer.phoneDisplay}
                  </a>
                </dd>
              </div>

              <div className="border-b border-rule p-5">
                <dt className="eyebrow text-[color:var(--ink-muted)]">{copy.location.hoursLabel}</dt>
                <dd className="mt-2">
                  <OpeningHours />
                </dd>
              </div>

              <div className="p-5">
                <dt className="eyebrow text-[color:var(--ink-muted)]">{copy.location.serviceAreaLabel}</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {dealer.serviceArea.map((area) => (
                    <span key={area} className="rounded-sm bg-mist px-2.5 py-1 text-sm">
                      {area}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/*
            A photograph of the building, not a map.

            The dealership has no Google Business listing yet, so the embed was a
            search for a name Maps does not know — which renders as a blank white
            rectangle, and would at best drop a pin in the wrong place. Someone
            looking for a new showroom on a road in a small town is better served
            by knowing what the front of it looks like, which is exactly what the
            copy beside it says: ask for us by name, the TVS board is on the
            front. The directions button is still one tap away.

            When the listing exists, this becomes the map again in one edit.
          */}
          <figure className="relative m-0 overflow-hidden rounded-sm border border-rule">
            <img
              src={src('storefront')}
              srcSet={srcSet('storefront')}
              sizes="(min-width: 1280px) 38rem, 92vw"
              alt={photos.storefront.alt}
              width={photos.storefront.width}
              height={photos.storefront.height}
              loading="lazy"
              decoding="async"
              className="h-full min-h-[320px] w-full object-cover"
              style={{ backgroundImage: `url("${photos.storefront.blur}")`, backgroundSize: 'cover' }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-5 pb-4 pt-10">
              <a
                href={dealer.mapDirections}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center gap-2 text-sm font-semibold text-white underline underline-offset-4"
              >
                {copy.actions.directions}
                <span aria-hidden>→</span>
              </a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function EnquirySection() {
  const { copy } = useLocale();

  return (
    // Motion is absent here. Where the visitor is doing work, the interface holds still.
    <section id="enquiry" data-section={copy.form.heading} className="section-ink scroll-mt-20">
      <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:gap-16 xl:py-20">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.form.heading}</h2>
          <p className="mt-4 text-[color:var(--on-ink-muted)]">{copy.form.sub}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[color:var(--on-ink-muted)]">
            {copy.form.offlineNote}
          </p>
        </div>
        <div>
          <EnquiryForm onInk />
        </div>
      </div>
    </section>
  );
}
