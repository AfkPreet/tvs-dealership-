'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import { featuredVehicles, byRank } from '@/content/vehicles';
import { dealer, addressOneLine } from '@/content/dealer';
import { EMI_DEFAULTS, indicativeEmi } from '@/lib/emi';
import { formatINR, formatTime } from '@/lib/format';
import { telLink } from '@/lib/whatsapp';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { PriceSheet } from '@/components/vehicles/PriceSheet';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';

/* ------------------------------------------------------------------ */

export function ModelShortlist() {
  const { copy } = useLocale();

  return (
    <section id="models" data-section={copy.models.heading} className="section-light">
      <div className="shell py-16 xl:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.models.heading}</h2>
              <p className="mt-3 text-[color:var(--ink-muted)]">{copy.models.sub}</p>
            </div>
            <Link href="/vehicles" className="btn btn-secondary">
              {copy.actions.viewAll}
            </Link>
          </div>
        </Reveal>

        <ul className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredVehicles.map((vehicle, index) => (
            <Reveal as="li" key={vehicle.slug} delay={index * 60}>
              <VehicleCard vehicle={vehicle} />
            </Reveal>
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
      <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:items-center xl:py-24">
        <Reveal>
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
        </Reveal>

        <Reveal delay={80}>
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
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function WhyBuyHere() {
  const { copy } = useLocale();

  return (
    <section id="why" data-section={copy.why.heading} className="section-mist">
      <div className="shell py-16 xl:py-24">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.why.heading}</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ink-muted)]">{copy.why.sub}</p>
        </Reveal>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-2 xl:grid-cols-3">
          {copy.why.items.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 50} className="bg-white p-6 xl:p-8">
              <p className="flex items-center gap-2 font-semibold">
                <span aria-hidden className="text-verified">
                  ✓
                </span>
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-muted)]">{item.body}</p>
            </Reveal>
          ))}
        </ul>

        {/* The price sheet appears in miniature here, using a real model. */}
        <Reveal delay={80}>
          <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_420px] xl:items-center">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl font-bold tracking-tightest xl:text-3xl">
                {copy.model.onRoadHeading}
              </h3>
              <p className="mt-3 text-[color:var(--ink-muted)]">{copy.model.onRoadSub}</p>
            </div>
            <PriceSheet
              onRoad={byRank[0].onRoad}
              variant="mini"
              vehicleName={byRank[0].name}
              href={`/vehicles/${byRank[0].slug}`}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function LocationSection() {
  const { copy } = useLocale();

  return (
    <section id="location" data-section={copy.location.heading} className="section-light">
      <div className="shell py-16 xl:py-24">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.location.heading}</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ink-muted)]">{copy.location.sub}</p>
        </Reveal>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_1.15fr]">
          <Reveal>
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
                  <ul className="space-y-1 text-sm">
                    {dealer.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-4">
                        <span className="text-[color:var(--ink-muted)]">{copy.location.days[h.day]}</span>
                        <span className="tnum font-medium">
                          {h.open && h.close
                            ? `${formatTime(h.open)} – ${formatTime(h.close)}`
                            : copy.location.closed}
                        </span>
                      </li>
                    ))}
                  </ul>
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
          </Reveal>

          <Reveal delay={60}>
            <div className="h-full min-h-[320px] overflow-hidden rounded-sm border border-rule">
              <iframe
                src={dealer.mapEmbed}
                title={copy.location.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[320px] w-full border-0"
              />
            </div>
          </Reveal>
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
      <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:gap-16 xl:py-24">
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
