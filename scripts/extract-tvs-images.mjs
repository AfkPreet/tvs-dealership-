/**
 * Reads the saved tvsmotor.com pages and writes the exact list of images to download.
 *
 * The first pass of the pipeline rendered every model page and saved the HTML,
 * but its image heuristics looked for absolute URLs and TVS serves relative
 * ones, so it came back with the pages and almost no pictures. Rather than
 * guessing again from inside a browser, this reads those saved pages offline and
 * pulls out the two things that actually matter:
 *
 *   the navigation's product shot for each model — one clean, consistent studio
 *   image per model, the same treatment across the whole range, which is exactly
 *   what a card wants
 *
 *   the colour picker's per-colour image directories — TVS keeps a numbered 360
 *   sequence per colour per variant, and frame 1 of each is a straight side-on
 *   photograph of the bike in that colour
 *
 * Output is content/tvs-images.json: a flat, reviewable list of URLs. Downloading
 * it is a separate step that needs no browser at all.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';

const PAGES = path.join(process.cwd(), 'media', 'tvs-pages');
const ORIGIN = 'https://www.tvsmotor.com';

/** Nav alt text -> our slug. Anything unlisted is a model we do not sell. */
const NAV_ALT_TO_SLUG = {
  'TVS Jupiter': 'jupiter-110',
  'TVS Jupiter 125': 'jupiter-125',
  'TVS Ntorq 125': 'ntorq-125',
  'TVS Ntorq': 'ntorq-125',
  'TVS Zest 110': 'zest-110',
  'TVS Raider': 'raider-125',
  'TVS Sport': 'sport',
  'TVS StaR City+': 'star-city-plus',
  'TVS Radeon': 'radeon',
  'TVS XL100': 'xl100',
  'TVS iQube': 'iqube',
  'TVS X': 'tvs-x',
  'Apache RTR 160': 'apache-rtr-160',
  'Apache RTR 160 4V': 'apache-rtr-160-4v',
  'Apache RTR 180': 'apache-rtr-180',
  'Apache RTR 200 4V': 'apache-rtr-200-4v',
  'Apache RTR 310': 'apache-rtr-310',
  'Apache RR 310': 'apache-rr-310',
  'TVS Ronin': 'ronin',
};

/** The Orbiter is missing from the nav, so it comes from the home page grid. */
const EXTRA_CARDS = {
  orbiter: '/-/media/HomeOptimizedImages/TVS-Home-Page-WebP/Desktop/Vehicles/EV/TVS-Orbiter.webp',
};

/** Strips the per-page prefix TVS puts in front of shared media paths. */
const normalise = (p) => ORIGIN + p.replace(/^\/[^/]+(?:\/[^/]+)*?(\/-\/media\/)/, '$1');

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Model cards: one studio shot per model, gathered from every page's nav. */
function cardImages(html, into) {
  const tag = /<img\b[^>]*>/gi;
  for (const [raw] of html.matchAll(tag)) {
    if (!raw.includes('/-/media/Feature/Navbar/New-Product-images/')) continue;
    const alt = raw.match(/\balt="([^"]*)"/i)?.[1]?.trim();
    const src = raw.match(/\bdata-src="([^"]+)"/i)?.[1] ?? raw.match(/\bsrc="([^"]+)"/i)?.[1];
    const slug = alt && NAV_ALT_TO_SLUG[alt];
    if (!slug || !src) continue;
    // First page wins: the newest dated folder is the one the live nav points at,
    // and pages agree with each other, so an arbitrary tie-break is fine.
    if (!into.has(slug)) into.set(slug, normalise(src));
  }
}

/**
 * Colour photographs, from the `#colours` picker.
 *
 * The same colour name appears once per variant that offers it, pointing at that
 * variant's own directory. We keep the first, which is the top variant, and that
 * is the one whose photograph is worth showing.
 */
function colourImages(html) {
  const start = html.indexOf('<div class="color-tabs"');
  if (start === -1) return [];
  const block = html.slice(start, start + 40_000);

  const swatch = /<li class="[^"]*?\bimg-src\b[^"]*"\s+data-path="([^"]*)"\s+title="([^"]*)"/gi;
  const seen = new Map();

  for (const [, dir, title] of block.matchAll(swatch)) {
    const name = title.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    if (!dir) continue;
    seen.set(name.toLowerCase(), {
      name,
      slug: slugify(name),
      // Frame 1 of the sequence is the side-on shot.
      url: normalise(`${dir.replace(/\/$/, '')}/1.webp`),
    });
  }
  return [...seen.values()];
}

/**
 * Extra views, for the pages that use a slider rather than the colour picker.
 *
 * The Apache and Jupiter pages have no `data-path` swatches; their colour
 * sections are sliders of plain images. The filenames do carry colour names, but
 * only sometimes and in no consistent shape — "Racing-Red-New" alongside
 * "colors_desktop_new" and "RTR_700X500_GLOSSY_BLACK". Guessing a colour name
 * from that is how a site ends up labelling a red bike "Pix Black".
 *
 * So these are collected as unnamed gallery images instead. The curated colour
 * names in content/vehicles.ts stay authoritative, the swatch still shows the
 * colour, and the stage falls back to the model's own photograph. Nothing is
 * labelled with a name nobody verified.
 */
function galleryImages(html) {
  const sections = [
    ...html.matchAll(/<section\b[^>]*class="[^"]*colou?rs?[^"]*"[^>]*>/gi),
    ...html.matchAll(/<(?:div|section)\b[^>]*id="colou?rs?[^"]*"[^>]*>/gi),
  ];
  const seen = new Map();

  for (const match of sections) {
    const block = html.slice(match.index, match.index + 30_000);
    for (const [raw] of block.matchAll(/<img\b[^>]*>/gi)) {
      const src = raw.match(/\bdata-src="([^"]+)"/i)?.[1] ?? raw.match(/\bsrc="([^"]+)"/i)?.[1];
      if (!src || !/\.(?:webp|png|jpe?g)$/i.test(src)) continue;
      if (!/\/-\/media\//.test(src)) continue;
      // Icons, backgrounds and spec glyphs share the section; colour art does not
      // live in those folders.
      if (/\b(icon|logo|bg|background|arrow|spec|banner)\b/i.test(src)) continue;

      const file = decodeURIComponent(src.split('/').pop() ?? '').replace(/\.[a-z]+$/i, '');
      const name = file
        .replace(/^\d+[_-]?/, '')
        .replace(/\b(new|tank|webp|desktop|mobile|\d+v|\d+)\b/gi, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (name.length < 3 || name.length > 32) continue;

      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.set(key, normalise(src));
    }
  }
  // Four is enough for a strip under the stage, and keeps the page's weight sane.
  return [...seen.values()].slice(0, 4);
}

/**
 * The saved pages are stored gzipped: 11MB of rendered HTML becomes about 1MB,
 * and they are kept as the provenance record for every image on the site rather
 * than because anything reads them at build time.
 */
async function readPage(file) {
  const buffer = await readFile(path.join(PAGES, file));
  return (file.endsWith('.gz') ? gunzipSync(buffer) : buffer).toString('utf8');
}

const files = (await readdir(PAGES)).filter((f) => f.endsWith('.html') || f.endsWith('.html.gz'));
const cards = new Map();
const models = {};

for (const file of files.sort()) {
  const slug = file.replace(/\.html(\.gz)?$/, '');
  const html = await readPage(file);
  cardImages(html, cards);
  const colours = colourImages(html);
  const gallery = colours.length > 0 ? [] : galleryImages(html);
  models[slug] = { colours, gallery };
  console.log(
    `${slug.padEnd(20)} colours=${String(colours.length).padStart(2)} gallery=${gallery.length}` +
      (colours.length ? `  e.g. ${colours[0].name}` : ''),
  );
}

for (const [slug, url] of Object.entries(EXTRA_CARDS)) {
  if (!cards.has(slug)) cards.set(slug, ORIGIN + url);
}

let missing = 0;
for (const slug of Object.keys(models)) {
  models[slug].card = cards.get(slug) ?? null;
  if (!models[slug].card) {
    missing += 1;
    console.warn(`  no card image for ${slug}`);
  }
}

const out = {
  origin: ORIGIN,
  extractedAt: new Date().toISOString(),
  note: 'Derived offline from media/tvs-pages/*.html. Regenerate with `npm run extract:tvs`.',
  models,
};
await writeFile(path.join(process.cwd(), 'content', 'tvs-images.json'), JSON.stringify(out, null, 2) + '\n');

const colourTotal = Object.values(models).reduce((n, m) => n + m.colours.length, 0);
const galleryTotal = Object.values(models).reduce((n, m) => n + m.gallery.length, 0);
console.log(
  `\n${Object.keys(models).length} models, ${cards.size} card images (${missing} missing), ` +
    `${colourTotal} named colour photographs, ${galleryTotal} extra views`,
);
console.log('wrote content/tvs-images.json');
