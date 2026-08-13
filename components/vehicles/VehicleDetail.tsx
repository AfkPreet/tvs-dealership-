'use client';

import Link from 'next/link';
import { useLocale, useLocalised } from '@/lib/locale';
import { formatINR } from '@/lib/format';
import { EMI_DEFAULTS, indicativeEmi } from '@/lib/emi';
import { whatsappLink } from '@/lib/whatsapp';
import type { Vehicle } from '@/content/vehicles';
import { Spinner360 } from './Spinner360';
import { PriceSheet } from './PriceSheet';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';

export function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const { copy, locale } = useLocale();
  const t = useLocalised();

  const labels = copy.model.specLabels;
  const values = copy.model.specValues;
  const s = vehicle.specs;
  const path = `/vehicles/${vehicle.slug}`;

  const specRows: { label: string; value: string }[] = [
    s.displacementCc
      ? { label: labels.engine, value: `${s.displacementCc} cc` }
      : { label: labels.battery, value: `${s.batteryKwh} kWh` },
    { label: labels.power, value: s.power },
    { label: labels.torque, value: s.torque },
    { label: labels.cooling, value: values[s.cooling] },
    { label: labels.transmission, value: values[s.transmission] },
    s.mileageKmpl
      ? { label: labels.mileage, value: `${s.mileageKmpl} kmpl` }
      : { label: labels.range, value: `${s.rangeKm} km` },
    { label: labels.kerbWeight, value: `${s.kerbWeightKg} kg` },
    s.fuelTankL
      ? { label: labels.fuelTank, value: `${s.fuelTankL} L` }
      : { label: labels.chargeTime, value: `${s.chargeTimeHrs} hrs` },
    { label: labels.seatHeight, value: `${s.seatHeightMm} mm` },
    { label: labels.wheelbase, value: `${s.wheelbaseMm} mm` },
    { label: labels.groundClearance, value: `${s.groundClearanceMm} mm` },
    {
      label: labels.brakes,
      value: `${values.front} ${values[s.brakes.front]} · ${values.rear} ${values[s.brakes.rear]}${
        s.brakes.system === 'none' ? '' : ` ${values[s.brakes.system]}`
      }`,
    },
    {
      label: labels.suspension,
      value: `${values[s.suspension.front]} · ${values[s.suspension.rear]}`,
    },
    { label: labels.colours, value: vehicle.colours.map((c) => c.name).join(', ') },
  ];

  const emi = indicativeEmi(vehicle.onRoad.total);

  return (
    <>
      {/* Showpiece A sits on --ink: a lit object in a dark showroom. */}
      <section id="model" data-section={vehicle.name} className="section-ink">
        <div className="shell py-10 xl:py-16">
          <Link
            href="/vehicles"
            className="tap inline-flex items-center gap-2 text-sm text-[color:var(--on-ink-muted)] hover:text-white"
          >
            <span aria-hidden>←</span> {copy.model.backToAll}
          </Link>

          <div className="mt-6 grid gap-10 xl:grid-cols-[1.1fr_1fr] xl:items-center xl:gap-16">
            <div className="order-2 xl:order-1">
              <p className="eyebrow text-tvsred-onink">{copy.categories[vehicle.category]}</p>
              <h1 className="mt-3 text-4xl font-extrabold md:text-5xl xl:text-6xl">{vehicle.name}</h1>
              <p className="mt-3 text-lg text-[color:var(--on-ink-muted)]">{t(vehicle.tagline)}</p>
              <p className="mt-5 max-w-lg leading-relaxed text-[color:var(--on-ink-muted)]">{t(vehicle.blurb)}</p>

              {/* Inline EMI strip — the monthly figure, right where the decision is. */}
              <div className="mt-8 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm border border-white/15 bg-graphite px-5 py-4">
                <span className="tnum font-display text-2xl font-bold tracking-tightest text-tvsred-onink">
                  {copy.model.emiStrip(formatINR(emi), EMI_DEFAULTS.months)}
                </span>
                <Link
                  href="/finance"
                  className="tap inline-flex items-center text-sm underline underline-offset-4 hover:text-tvsred-onink"
                >
                  {copy.actions.calculateEmi}
                </Link>
                <span className="basis-full text-xs text-[color:var(--on-ink-muted)]">
                  {copy.model.emiStripNote}
                </span>
              </div>
            </div>

            <div className="order-1 xl:order-2">
              <Spinner360 slug={vehicle.slug} name={vehicle.name} colours={vehicle.colours} />
            </div>
          </div>
        </div>
      </section>

      {/* Price sheet and specs sit side by side on desktop, stacked on a phone. */}
      <section id="price" data-section={copy.model.onRoadHeading} className="section-mist">
        <div className="shell grid gap-8 py-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)] xl:items-start xl:py-24">
          <Reveal>
            <h2 className="text-3xl font-extrabold md:text-4xl">{copy.model.specsHeading}</h2>
            <table className="mt-6 w-full border-collapse bg-white text-left text-[15px]">
              <caption className="sr-only">
                {copy.model.specsHeading} — {vehicle.name}
              </caption>
              <tbody>
                {specRows.map((row) => (
                  <tr key={row.label} className="border-b border-rule">
                    <th scope="row" className="w-2/5 px-4 py-3 font-normal text-[color:var(--ink-muted)]">
                      {row.label}
                    </th>
                    <td className="tnum px-4 py-3 font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="mt-12 text-3xl font-extrabold md:text-4xl">{copy.model.variantsHeading}</h2>
            <table className="mt-6 w-full border-collapse bg-white text-left text-[15px]">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">
                    {copy.model.variantColumn}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-sm font-semibold">
                    {copy.model.priceColumn}
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicle.variants.map((variant) => (
                  <tr key={variant.name} className="border-b border-rule">
                    <td className="px-4 py-3">
                      <span className="font-medium">{variant.name}</span>
                      {variant.note ? (
                        <span className="block text-sm text-[color:var(--ink-muted)]">{t(variant.note)}</span>
                      ) : null}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-semibold">{formatINR(variant.exShowroom)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <div className="xl:sticky xl:top-28">
            <PriceSheet onRoad={vehicle.onRoad} vehicleName={vehicle.name} />
          </div>
        </div>
      </section>

      {/* Motion is absent from the CTA block — the visitor is doing work here. */}
      <section id="enquiry" data-section={copy.model.ctaHeading} className="section-ink scroll-mt-20">
        <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:gap-16 xl:py-24">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.model.ctaHeading}</h2>
            <p className="mt-4 text-[color:var(--on-ink-muted)]">{copy.model.ctaSub}</p>

            <Magnetic className="mt-8">
              <a
                href={whatsappLink({ kind: 'price', model: vehicle.name, sourcePath: path, locale })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {copy.actions.getBestPrice}
              </a>
            </Magnetic>

            <div className="mt-12 border-t border-white/10 pt-6">
              <h3 className="eyebrow text-[color:var(--on-ink-muted)]">{copy.model.sourcesHeading}</h3>
              <ul className="mt-3 space-y-1.5 text-sm">
                {vehicle.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-[color:var(--on-ink-muted)] underline underline-offset-4 hover:text-white"
                    >
                      {source.label}
                    </a>
                    <span className="tnum ml-2 text-xs text-[color:var(--on-ink-muted)]">{source.readOn}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 max-w-md text-xs leading-relaxed text-[color:var(--on-ink-muted)]">
                {copy.model.sourcesNote}
              </p>
            </div>
          </div>

          <div>
            <EnquiryForm onInk defaultModel={vehicle.name} kind="testRide" />
          </div>
        </div>
      </section>
    </>
  );
}
