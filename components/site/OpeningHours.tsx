'use client';

import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';
import { formatTime } from '@/lib/format';
import { telLink } from '@/lib/whatsapp';

/**
 * The opening hours, or an honest admission that we do not know them.
 *
 * Nobody has told us when the showroom opens. Printing a plausible 9:30 to 8:00
 * would be the one error on this site that costs a visitor something real — a
 * trip out to Bilaspur Road to find the shutter down. So while `dealer.hours`
 * is null this renders the phone number and an instruction to call, which is
 * both true and more useful than a table.
 *
 * The moment real times are filled in, the table appears here, in the footer,
 * on the service page and in the structured data, from this one component.
 */
export function OpeningHours({ onInk = false }: { onInk?: boolean }) {
  const { copy } = useLocale();
  const muted = onInk ? 'text-[color:var(--on-ink-muted)]' : 'text-[color:var(--ink-muted)]';
  const strong = onInk ? 'text-white' : '';

  if (!dealer.hours) {
    return (
      <p className={`text-sm leading-relaxed ${muted}`}>
        {copy.location.hoursUnknown}{' '}
        <a href={telLink} className={`tap font-medium underline underline-offset-4 ${strong}`}>
          <span className="tnum">{dealer.phoneDisplay}</span>
        </a>
      </p>
    );
  }

  return (
    <ul className="space-y-1 text-sm">
      {dealer.hours.map((h) => (
        <li key={h.day} className={`flex justify-between gap-4 ${muted}`}>
          <span>{copy.location.days[h.day]}</span>
          <span className={`tnum font-medium ${strong}`}>
            {h.open && h.close ? `${formatTime(h.open)} – ${formatTime(h.close)}` : copy.location.closed}
          </span>
        </li>
      ))}
    </ul>
  );
}
