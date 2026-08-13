'use client';

import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';
import { formatTime } from '@/lib/format';
import { EnquiryForm } from '@/components/forms/EnquiryForm';

/**
 * Service is built and working, but it is deliberately not in prime real estate
 * at launch. The page is lean on purpose — it will matter in month nine.
 *
 * There is no motion anywhere on this page. The visitor is filling in a form.
 */
export function ServiceBooking() {
  const { copy } = useLocale();

  return (
    <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] xl:gap-16">
      <div>
        <EnquiryForm variant="service" kind="service" />
      </div>

      <div>
        <div className="rounded-sm border border-verified/30 bg-verified/5 p-6">
          <h2 className="flex items-start gap-2 font-display text-xl font-bold tracking-tightest">
            <span aria-hidden className="text-verified">
              ✓
            </span>
            {copy.service.warrantyHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-[color:var(--ink-muted)]">{copy.service.warrantyBody}</p>
        </div>

        <div className="mt-6 rounded-sm border border-rule p-6">
          <h3 className="eyebrow text-[color:var(--ink-muted)]">{copy.location.hoursLabel}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {dealer.hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span className="text-[color:var(--ink-muted)]">{copy.location.days[h.day]}</span>
                <span className="tnum font-medium">
                  {h.open && h.close ? `${formatTime(h.open)} – ${formatTime(h.close)}` : copy.location.closed}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--ink-muted)]">{copy.service.slotNote}</p>
        </div>
      </div>
    </div>
  );
}
