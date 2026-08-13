'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { byRank, categories, type VehicleCategory } from '@/content/vehicles';
import { VehicleCard } from './VehicleCard';

type Filter = VehicleCategory | 'all';

const isCategory = (value: string | null): value is VehicleCategory =>
  categories.includes(value as VehicleCategory);

/**
 * Filtering is client-side and instant — no page reload — and it is written back
 * into the URL query, so a filtered view can be pasted into WhatsApp and opens
 * for the next person exactly as it was left.
 *
 * The query is read from `window.location` and written with `history.replaceState`
 * rather than through the router, which keeps the page a plain static export with
 * no Suspense bailout and no extra client bundle.
 */
export function VehicleBrowser() {
  const { copy } = useLocale();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('type');
    if (isCategory(param)) setFilter(param);
  }, []);

  const choose = (next: Filter) => {
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', next);
    window.history.replaceState(null, '', url);
  };

  const shown = filter === 'all' ? byRank : byRank.filter((v) => v.category === filter);
  const options: Filter[] = ['all', ...categories];

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label={copy.vehiclesPage.filterLabel}>
        {options.map((option) => {
          const active = option === filter;
          const count = option === 'all' ? byRank.length : byRank.filter((v) => v.category === option).length;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              aria-pressed={active}
              className={`tap rounded-sm border px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-rule bg-white text-[color:var(--ink-muted)] hover:border-ink hover:text-ink'
              }`}
            >
              {option === 'all' ? copy.vehiclesPage.all : copy.categories[option]}
              <span className={`tnum ml-2 text-xs ${active ? 'text-white/60' : 'text-[color:var(--ink-muted)]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-[color:var(--ink-muted)]">
        {copy.vehiclesPage.count(shown.length)}
      </p>

      {shown.length === 0 ? (
        <p className="mt-10 rounded-sm border border-rule bg-mist p-8 text-center">{copy.vehiclesPage.empty}</p>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((vehicle, index) => (
            <li key={vehicle.slug}>
              <VehicleCard vehicle={vehicle} eager={index < 3} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
