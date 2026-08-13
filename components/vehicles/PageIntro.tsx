'use client';

import { useLocale } from '@/lib/locale';

/**
 * Page headings live in a tiny client component because the copy comes from the
 * locale context. Keeping it this small means the surrounding page stays a plain
 * static server component.
 */
export function PageIntro({ section }: { section: 'vehiclesPage' | 'finance' | 'service' }) {
  const { copy } = useLocale();
  const { title, sub } = copy[section];

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-extrabold md:text-5xl xl:text-6xl">{title}</h1>
      <p className="mt-4 text-[color:var(--ink-muted)] md:text-lg">{sub}</p>
    </div>
  );
}
