'use client';

import { useLocale } from '@/lib/locale';
import { dealer, addressOneLine, placeLine } from '@/content/dealer';
import { photos, src, srcSet } from '@/content/photos';
import { telLink, whatsappLink } from '@/lib/whatsapp';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';

/** The showroom photographs, in the order they tell the story. */
const STORY_PHOTOS = ['storefront', 'opening-floor', 'first-delivery', 'scooters'] as const;

function Photo({
  id,
  className = '',
  sizes,
  eager = false,
}: {
  id: (typeof STORY_PHOTOS)[number] | 'opening-day';
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const photo = photos[id];
  return (
    <img
      src={src(id)}
      srcSet={srcSet(id)}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`w-full rounded-sm object-cover ${className}`}
      style={{ backgroundImage: `url("${photo.blur}")`, backgroundSize: 'cover' }}
    />
  );
}

export function AboutIntro() {
  const { copy } = useLocale();

  return (
    <section id="about" data-section={copy.about.title} className="section-ink">
      <div className="shell grid gap-10 py-14 xl:grid-cols-[1fr_1.05fr] xl:items-center xl:gap-16 xl:py-24">
        <div className="max-w-xl">
          <p className="eyebrow text-tvsred-onink">{placeLine}</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] md:text-5xl xl:text-6xl">
            {copy.about.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[color:var(--on-ink-muted)]">
            {dealer.about.lede}
          </p>
        </div>

        <div className="relative">
          <Photo
            id="opening-day"
            eager
            sizes="(min-width: 1280px) 40rem, 92vw"
            className="aspect-[3/2]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-sm bg-[color:var(--tvs-red)]"
          />
        </div>
      </div>
    </section>
  );
}

export function AboutStory() {
  const { copy } = useLocale();

  return (
    <section data-section={copy.about.storyHeading} className="section-light">
      <div className="shell grid gap-10 py-16 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] xl:gap-16 xl:py-24">
        <Reveal>
          <h2 className="rail-heading-light text-3xl font-extrabold md:text-4xl">
            {copy.about.storyHeading}
          </h2>
          <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-[color:var(--ink-muted)]">
            {dealer.about.story.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <dl className="mt-10 border-t border-rule pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-[color:var(--ink-muted)]">{copy.about.sinceLabel}</dt>
              <dd className="tnum font-display text-2xl font-bold tracking-tightest">{dealer.since}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid gap-4 sm:grid-cols-2">
            {STORY_PHOTOS.map((id) => (
              <Photo
                key={id}
                id={id}
                sizes="(min-width: 1280px) 20rem, (min-width: 640px) 44vw, 92vw"
                className="aspect-[4/3]"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-[color:var(--ink-muted)]">{copy.about.photoCredit}</p>
        </Reveal>
      </div>
    </section>
  );
}

export function AboutTeam() {
  const { copy } = useLocale();
  // Nothing invented: with no names supplied, the section does not render at all
  // rather than showing placeholder people.
  if (dealer.about.team.length === 0) return null;

  return (
    <section data-section={copy.about.teamHeading} className="section-mist">
      <div className="shell py-16 xl:py-24">
        <Reveal>
          <h2 className="rail-heading-light text-3xl font-extrabold md:text-4xl">
            {copy.about.teamHeading}
          </h2>
        </Reveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {dealer.about.team.map((person, index) => (
            <Reveal as="li" key={person.name} delay={index * 60}>
              <div className="h-full rounded-sm border border-rule bg-white p-5">
                <p className="font-display text-lg font-bold tracking-tightest">{person.name}</p>
                <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{person.role}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AboutVisit() {
  const { copy, locale } = useLocale();

  return (
    <section id="visit" data-section={copy.about.visitHeading} className="section-ink scroll-mt-20">
      <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:gap-16 xl:py-24">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold md:text-4xl xl:text-5xl">{copy.about.visitHeading}</h2>
          <p className="mt-4 text-[color:var(--on-ink-muted)]">{copy.about.visitBody}</p>

          <address className="mt-8 not-italic leading-relaxed text-[color:var(--on-ink-muted)]">
            {addressOneLine}
          </address>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Magnetic>
              <a
                href={whatsappLink({ kind: 'general', sourcePath: '/about', locale })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full sm:w-auto"
              >
                {copy.actions.whatsapp}
              </a>
            </Magnetic>
            <a href={telLink} className="btn btn-on-ink">
              {copy.actions.callNow} — <span className="tnum">{dealer.phoneDisplay}</span>
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-white/12">
          <iframe
            src={dealer.mapEmbed}
            title={copy.location.mapTitle}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full border-0 xl:h-full xl:min-h-[22rem]"
          />
        </div>
      </div>
    </section>
  );
}
