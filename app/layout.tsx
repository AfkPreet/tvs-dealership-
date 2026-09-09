import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { LocaleProvider } from '@/lib/locale';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { FloatingActions } from '@/components/site/FloatingActions';
import { Intro } from '@/components/site/Intro';
import { DesktopMotionLayer } from '@/components/site/DesktopMotionLayer';
import { dealer, addressOneLine, dealerFullName, placeLine } from '@/content/dealer';

/**
 * Fonts are self-hosted through next/font — no request ever leaves for a font
 * CDN, so there is no render-blocking third-party round trip on a 4G connection.
 *
 * Note on Devanagari: Inter and Bricolage Grotesque are Latin-only, so Hindi
 * copy is set in Noto Sans Devanagari, which sits next in the stack and is
 * loaded with its own subset. Latin words inside Hindi sentences — "EMI",
 * "RTO", model names — still render in Inter, which is exactly how they should
 * look.
 */
/**
 * Headings only, and only at the two weights the design actually uses.
 * Preloaded: it sets the h1, which is the first thing anyone reads, and
 * measurement showed dropping the preload bought nothing.
 */
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  // The variable file, not two static cuts. Asking for 700 and 800 separately
  // shipped 48KB + 41KB; one variable face covers both for less, and headings
  // are the only thing that uses it.
  variable: '--font-display-latin',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body-latin',
  display: 'swap',
});

/**
 * Deliberately NOT preloaded. The Devanagari face is 121KB — over half the font
 * budget — and an English visitor never renders a glyph from it. Leaving it out
 * of the preload list takes it off the critical path entirely; the browser
 * fetches it the moment Hindi copy actually needs it, and `display: swap` keeps
 * text visible while it arrives.
 */
const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(dealer.siteUrl),
  title: {
    default: `${dealerFullName} — TVS scooters, bikes, finance and service`,
    template: `%s — ${dealer.name}, ${dealer.city}`,
  },
  description: `Authorised TVS dealer in ${placeLine}. Full on-road prices, a working EMI calculator, test rides and 3S service on ${dealer.address.line2}. Call ${dealer.phoneDisplay}.`,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: dealer.name,
    title: `${dealerFullName}`,
    description: 'On-road prices in full, EMI worked out for you, and every enquiry answered on WhatsApp.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // iOS: paint into the notch and home-indicator areas, then pad with env().
  viewportFit: 'cover',
  themeColor: '#0E0E10',
};

/**
 * JSON-LD so the Google Business Profile, the Maps listing and the site agree
 * with each other. Every value resolves from content/dealer.ts.
 */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: dealer.name,
  description: dealerFullName,
  telephone: `+${dealer.phone}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: [dealer.address.line1, dealer.address.line2].filter(Boolean).join(', '),
    addressLocality: dealer.address.city,
    addressRegion: dealer.address.state,
    postalCode: dealer.address.pincode,
    addressCountry: 'IN',
  },
  geo: { '@type': 'GeoCoordinates', latitude: dealer.geo.lat, longitude: dealer.geo.lng },
  // Omitted entirely while the real times are unknown: asserting invented hours
  // to a search engine is how a shut shutter ends up in a Maps card.
  openingHoursSpecification: (dealer.hours ?? []).map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${{ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }[h.day]}`,
    opens: h.open,
    closes: h.close,
  })),
  url: dealer.siteUrl,
  areaServed: dealer.serviceArea,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'hi' ? 'hi-IN' : 'en-IN'}
      className={`${display.variable} ${body.variable} ${devanagari.variable}`}
      style={
        {
          // 'Rupee ...' comes first and covers exactly one codepoint, so ₹ is
          // served from a 1KB file and everything else falls through untouched.
          '--font-display': `'Rupee Display', var(--font-display-latin), var(--font-devanagari)`,
          '--font-body': `'Rupee Body', var(--font-body-latin), var(--font-devanagari)`,
        } as React.CSSProperties
      }
    >
      <head>
        {/* Both are ~1KB and a price is above the fold on every page, so the
            currency symbol should never swap in late in a price column. */}
        <link rel="preload" href="/fonts/rupee-inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/rupee-display.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Static, build-time constant derived from content/dealer.ts.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <LocaleProvider>
          <Intro />
          <DesktopMotionLayer />
          <Header />
          <main id="main">{children}</main>
          <Footer address={addressOneLine} />
          <FloatingActions />
        </LocaleProvider>
      </body>
    </html>
  );
}
