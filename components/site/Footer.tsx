'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import { OpeningHours } from './OpeningHours';
import { dealer } from '@/content/dealer';
import { telLink, whatsappLink } from '@/lib/whatsapp';
import { formatTime } from '@/lib/format';

/**
 * The contact block lives in the footer so the address, hours and phone are
 * reachable from every page without navigating anywhere.
 */
export function Footer({ address }: { address: string }) {
  const { copy, locale } = useLocale();

  return (
    <footer className="section-ink border-t border-white/10">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 xl:grid-cols-4 xl:py-20">
        <div>
          <p className="font-display text-2xl font-bold tracking-tightest">{dealer.name}</p>
          <p className="mt-1 text-sm text-[color:var(--on-ink-muted)]">{copy.footer.tagline}</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-sm border border-verified/40 bg-verified/10 px-3 py-1.5 text-xs font-semibold text-[#5FD59A]">
            <span aria-hidden>✓</span>
            {copy.why.items[0].title}
          </p>
        </div>

        <nav aria-label={copy.footer.navHeading}>
          <h2 className="eyebrow text-[color:var(--on-ink-muted)]">{copy.footer.navHeading}</h2>
          <ul className="mt-4 space-y-1">
            {[
              { href: '/', label: copy.nav.home },
              { href: '/vehicles', label: copy.nav.vehicles },
              { href: '/finance', label: copy.nav.finance },
              { href: '/service', label: copy.nav.service },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="tap inline-flex items-center text-sm hover:text-tvsred-onink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-[color:var(--on-ink-muted)]">{copy.footer.contactHeading}</h2>
          <address className="mt-4 not-italic text-sm leading-relaxed text-[color:var(--on-ink-muted)]">
            {address}
          </address>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={telLink} className="tap inline-flex items-center hover:text-tvsred-onink">
                {dealer.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink({ kind: 'general', sourcePath: '/', locale })}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center hover:text-tvsred-onink"
              >
                {copy.actions.whatsapp}
              </a>
            </li>
            <li>
              <a
                href={dealer.mapDirections}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center hover:text-tvsred-onink"
              >
                {copy.actions.directions}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs text-[color:var(--on-ink-muted)]">
            {copy.location.gstinLabel}: <span className="tnum">{dealer.gstin}</span>
          </p>
        </div>

        <div>
          <h2 className="eyebrow text-[color:var(--on-ink-muted)]">{copy.footer.hoursHeading}</h2>
          <div className="mt-4">
            <OpeningHours onInk />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell py-10">
          <p className="max-w-4xl text-xs leading-relaxed text-[color:var(--on-ink-muted)]">{copy.footer.legal}</p>
          <p className="mt-3 text-xs text-[color:var(--on-ink-muted)]">
            {copy.footer.rights(new Date().getFullYear(), dealer.name)}
          </p>
        </div>
      </div>
    </footer>
  );
}
