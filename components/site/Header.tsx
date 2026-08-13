'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';
import { telLink } from '@/lib/whatsapp';

export function Header() {
  const { copy, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // A route change should never leave the mobile drawer hanging open.
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: '/', label: copy.nav.home },
    { href: '/vehicles', label: copy.nav.vehicles },
    { href: '/finance', label: copy.nav.finance },
    { href: '/service', label: copy.nav.service },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
      >
        {copy.nav.skipToContent}
      </a>

      <div className="shell flex h-16 items-center justify-between gap-4 xl:h-20">
        <Link href="/" className="tap flex items-center gap-3">
          {/* Placeholder mark. The real logo comes from the TVS dealer brand pack. */}
          <span aria-hidden className="h-7 w-1.5 shrink-0 rounded-sm bg-tvsred xl:h-8" />
          <span className="leading-none">
            <span className="block font-display text-[17px] font-bold tracking-tightest xl:text-xl">
              {dealer.name}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.14em] text-[color:var(--on-ink-muted)] md:block">
              {copy.footer.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label={copy.nav.menu} className="hidden xl:block">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`tap inline-flex items-center text-sm font-medium transition-colors ${
                    isActive(link.href) ? 'text-white' : 'text-[color:var(--on-ink-muted)] hover:text-white'
                  }`}
                >
                  <span className="relative">
                    {link.label}
                    <span
                      aria-hidden
                      className={`absolute -bottom-1.5 left-0 h-0.5 w-full origin-left bg-tvsred transition-transform duration-300 ${
                        isActive(link.href) ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle locale={locale} setLocale={setLocale} label={copy.meta.switchLabel} />

          <a href={telLink} className="btn btn-primary hidden h-11 min-h-0 text-sm xl:inline-flex">
            {copy.actions.callNow}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? copy.nav.close : copy.nav.openMenu}
            className="tap -mr-2 flex items-center justify-center xl:hidden"
          >
            <span aria-hidden className="relative block h-4 w-6">
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-white transition-transform duration-300 ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-6 bg-white transition-opacity duration-200 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-white transition-transform duration-300 ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label={copy.nav.menu} className="border-t border-white/10 xl:hidden">
          <ul className="shell py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className="tap flex items-center justify-between border-b border-white/8 py-3 text-base"
                >
                  <span>{link.label}</span>
                  {isActive(link.href) ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-tvsred" /> : null}
                </Link>
              </li>
            ))}
            <li className="py-4">
              <a href={telLink} className="btn btn-primary w-full">
                {copy.actions.callNow} — {dealer.phoneDisplay}
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function LocaleToggle({
  locale,
  setLocale,
  label,
}: {
  locale: 'en' | 'hi';
  setLocale: (l: 'en' | 'hi') => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded-sm border border-white/20 p-0.5 text-sm"
    >
      {(['en', 'hi'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[2px] px-2.5 font-medium transition-colors ${
            locale === code ? 'bg-white text-ink' : 'text-[color:var(--on-ink-muted)] hover:text-white'
          }`}
        >
          {code === 'en' ? 'EN' : <span className="glyph-devanagari">हिं</span>}
        </button>
      ))}
    </div>
  );
}
