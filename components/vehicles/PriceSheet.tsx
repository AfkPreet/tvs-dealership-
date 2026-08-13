'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import { useReducedExperience } from '@/lib/useReducedExperience';
import { formatINR } from '@/lib/format';
import { NumberRoll } from '@/components/ui/NumberRoll';
import type { OnRoadBreakdown } from '@/content/vehicles';

/**
 * The on-road price sheet — the signature object on this site.
 *
 * A receipt: hairline rules, tabular numerals, ex-showroom / RTO / insurance /
 * accessories stacking to a bolded red total. It is the most valuable thing on
 * the page for an Indian two-wheeler buyer, and it embodies the positioning —
 * this dealer tells you the real number.
 *
 * On desktop the rows reveal top to bottom and the total counts up, which ties
 * the motion language to the site's most important object instead of decorating
 * empty space.
 */
export function PriceSheet({
  onRoad,
  variant = 'full',
  vehicleName,
  href,
}: {
  onRoad: OnRoadBreakdown;
  variant?: 'full' | 'mini';
  vehicleName?: string;
  href?: string;
}) {
  const { copy } = useLocale();
  const reduced = useReducedExperience();
  const ref = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    if (reduced) {
      setBuilt(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setBuilt(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const rows = [
    { label: copy.model.onRoadRows.exShowroom, value: onRoad.exShowroom },
    { label: copy.model.onRoadRows.rto, value: onRoad.rto },
    { label: copy.model.onRoadRows.insurance, value: onRoad.insurance },
    { label: copy.model.onRoadRows.accessories, value: onRoad.accessories },
  ];

  const rowStyle = (index: number): React.CSSProperties =>
    reduced
      ? {}
      : {
          opacity: built ? 1 : 0,
          transform: built ? 'none' : 'translate3d(0, 10px, 0)',
          transition: `opacity 320ms ease ${index * 60}ms, transform 320ms cubic-bezier(0.22,1,0.36,1) ${index * 60}ms`,
        };

  const isMini = variant === 'mini';

  return (
    <div
      ref={ref}
      className={`rounded-sm border border-rule bg-white ${isMini ? 'p-5' : 'p-6 xl:p-8'}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className={`font-display font-bold tracking-tightest ${isMini ? 'text-lg' : 'text-2xl xl:text-3xl'}`}>
          {copy.model.onRoadHeading}
        </h3>
        {vehicleName ? (
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.1em] text-[color:var(--ink-muted)]">
            {vehicleName}
          </span>
        ) : null}
      </div>

      {!isMini ? (
        <p className="mt-2 max-w-prose text-sm text-[color:var(--ink-muted)]">{copy.model.onRoadSub}</p>
      ) : null}

      <dl className={isMini ? 'mt-4' : 'mt-6'}>
        {rows.map((row, index) => (
          <div key={row.label} className="sheet-row" style={rowStyle(index)}>
            <dt className={`${isMini ? 'text-sm' : 'text-[15px]'} text-[color:var(--ink-muted)]`}>{row.label}</dt>
            <dd className={`tnum shrink-0 font-medium ${isMini ? 'text-sm' : 'text-base'}`}>
              {formatINR(row.value)}
            </dd>
          </div>
        ))}

        <div
          className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-4"
          style={rowStyle(rows.length)}
        >
          <dt className={`font-semibold ${isMini ? 'text-sm' : 'text-base'}`}>{copy.model.onRoadRows.total}</dt>
          <dd
            className={`font-display font-extrabold tracking-tightest text-tvsred-onlight ${
              isMini ? 'text-2xl' : 'text-3xl xl:text-4xl'
            }`}
          >
            {built ? <NumberRoll value={onRoad.total} /> : <span className="tnum">{formatINR(onRoad.total)}</span>}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-[color:var(--ink-muted)]">{copy.model.onRoadNote}</p>

      {href ? (
        <Link href={href} className="btn btn-secondary mt-5 w-full">
          {copy.actions.viewModel}
        </Link>
      ) : null}
    </div>
  );
}
