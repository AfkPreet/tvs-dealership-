'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';
import { byRank } from '@/content/vehicles';
import { telLink } from '@/lib/whatsapp';
import { Magnetic } from '@/components/motion/Magnetic';
import { HeroStage } from './HeroStage';

/**
 * The first screen.
 *
 * The photograph is not in a box any more. On a wide screen it fills the full
 * height of the section and bleeds off the right edge, which is what removes
 * the dead space the old layout left underneath it and what makes the showroom
 * feel like the subject rather than an illustration beside the text. On a phone
 * the order is unchanged — headline, buttons, then the photograph — because the
 * two things a visitor came to do are call and message.
 *
 * Nothing here animates on arrival. The site's rule is that motion answers
 * something the visitor did — a tap, a hover, a drag — and never announces a
 * page that has finished loading. An entrance that plays every single time you
 * open a page is a delay dressed as craft.
 *
 * So the hero is simply the finished hero, from the first frame, with or
 * without JavaScript.
 */
export function Hero() {
  const { copy } = useLocale();

  return (
    <section id="hero" data-section={copy.nav.home} className="section-ink relative overflow-hidden">
      <div className="shell relative py-14 md:py-16 xl:min-h-[min(84vh,720px)] xl:py-20">
        <div className="flex h-full flex-col justify-center xl:max-w-[52%]">
          <p
            className="eyebrow inline-flex items-center gap-2 text-tvsred-onink"
          >
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-tvsred" />
            {copy.hero.eyebrow}
          </p>

          {/* Set tighter and larger than the body scale allows on its own: this
              is the only place on the site where type is the loudest element. */}
          <h1
            className="mt-5 text-[clamp(2.6rem,8.4vw,4rem)] font-extrabold leading-[0.94] tracking-[-0.035em] xl:text-[clamp(3.5rem,4.6vw,4.75rem)]"
          >
            {copy.hero.headline}
          </h1>

          <p
            className="mt-6 max-w-[34ch] text-[17px] leading-relaxed text-[color:var(--on-ink-muted)] md:text-lg"
          >
            {copy.hero.sub}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Magnetic>
              <Link href="#enquiry" className="btn btn-primary w-full sm:w-auto">
                {copy.actions.bookTestRide}
              </Link>
            </Magnetic>
            <a href={telLink} className="btn btn-on-ink">
              {copy.actions.callNow} — <span className="tnum">{dealer.phoneDisplay}</span>
            </a>
          </div>

          {/* Three true things, where the layout used to leave a hole. */}
          <dl
            className="mt-10 grid max-w-lg grid-cols-3 gap-x-4 border-t border-white/12 pt-6 sm:gap-x-5"
          >
            {copy.hero.proof.map((item) => (
              <div key={item.label}>
                <dt className="sr-only">{item.label}</dt>
                <dd>
                  <span className="tnum block font-display text-lg font-bold leading-none tracking-tightest text-white sm:text-2xl md:text-[1.75rem]">
                    {item.value(byRank.length)}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 block text-[12px] leading-snug text-[color:var(--on-ink-muted)] sm:text-[13px]"
                  >
                    {item.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

      </div>

      {/*
        After the copy in the DOM, so a phone reads headline, buttons, then the
        showroom — and a screen reader does the same. From xl it lifts out of the
        flow into a full-height panel down the right edge, which is what removes
        the dead space the old boxed layout left underneath it.
      */}
      <div className="xl:pointer-events-none xl:absolute xl:inset-y-0 xl:right-0 xl:w-[46%]">
        <HeroStage />
        {/* A gradient back into the section so the photograph has no hard edge
            against the copy. Left to right, so it never darkens the subject. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 hidden w-40 bg-gradient-to-r from-[color:var(--ink)] to-transparent xl:block"
        />
      </div>
    </section>
  );
}
