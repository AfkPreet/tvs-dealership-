'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';
import { telLink, whatsappLink } from '@/lib/whatsapp';

/**
 * WhatsApp and call, one thumb-reach away on every page.
 *
 * The bar is pinned to the bottom on phones — where the thumb already is — and
 * collapses to a single floating WhatsApp button on desktop. `env(safe-area-
 * inset-*)` keeps it clear of the iPhone home indicator instead of sitting under
 * it.
 *
 * It slides away while you read down the page and comes back the moment you
 * scroll up, which is when someone is looking for a way to act. 56px is a lot
 * of a phone screen to spend permanently, and the hero already carries both
 * buttons, so it stays hidden until you have scrolled past that.
 *
 * The spacer below it does not move with it: if it collapsed too, the page
 * would shorten every time the bar hid and the content under your thumb would
 * jump.
 */
export function FloatingActions() {
  const { copy, locale } = useLocale();
  const pathname = usePathname();

  // Visible by default, including in the exported HTML and with JavaScript off,
  // so the bar is never missing for someone who cannot run the script.
  const [shown, setShown] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY.current;
      // A small threshold, so a jittery thumb does not flap the bar.
      if (Math.abs(delta) > 6) {
        setShown(y < 240 || delta < 0);
        lastY.current = y;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const wa = whatsappLink({ kind: 'general', sourcePath: pathname, locale });

  return (
    <>
      {/* Phone: a two-up action bar docked to the bottom edge. */}
      <div
        data-action-bar
        aria-hidden={!shown}
        className={`safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 backdrop-blur transition-transform duration-300 xl:hidden ${
          shown ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="grid grid-cols-2 gap-px">
          <a
            href={telLink}
            className="tap flex min-h-[56px] items-center justify-center gap-2 text-sm font-semibold text-white active:bg-white/10"
          >
            <PhoneIcon />
            {copy.actions.callNow}
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="tap flex min-h-[56px] items-center justify-center gap-2 bg-tvsred-cta text-sm font-semibold text-white active:bg-tvsred-deep"
          >
            <WhatsAppIcon />
            {copy.actions.whatsapp}
          </a>
        </div>
      </div>

      {/* Desktop: a single floating button, out of the reading column. */}
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="tap fixed bottom-8 right-8 z-30 hidden items-center gap-2 rounded-sm bg-tvsred-cta px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/25 transition-transform duration-300 hover:-translate-y-0.5 xl:inline-flex"
      >
        <WhatsAppIcon />
        {copy.actions.whatsapp}
        <span className="sr-only">— {dealer.phoneDisplay}</span>
      </a>

      {/* Keeps the phone action bar from covering the end of every page. */}
      <div aria-hidden className="safe-bottom h-[56px] xl:hidden" />
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.19-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z" />
    </svg>
  );
}
