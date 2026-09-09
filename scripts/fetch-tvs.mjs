/**
 * Fetches official model pages from tvsmotor.com and extracts what the site
 * needs: per-colour studio images, gallery images, official colour names,
 * specification rows, variant names and ex-showroom prices.
 *
 * WHY A SCRIPT, WHY HERE
 * The development sandbox cannot reach tvsmotor.com, so this runs on a GitHub
 * Actions runner (.github/workflows/fetch-tvs.yml) or on any laptop with
 * `npm run fetch:tvs`. It is written to be run blind against a site whose DOM
 * cannot be inspected from where it was authored, so it errs towards
 * capturing *everything* — every image, every table, every price-looking
 * string, plus the page HTML and a full-page screenshot — and leaves the
 * judgement to a human reading content/tvs-raw.json afterwards.
 *
 * OUTPUT
 *   public/vehicles/<slug>/NN.webp        candidate images, converted, <=1600px
 *   public/vehicles/<slug>/raw/NN.<ext>   originals as downloaded
 *   media/tvs-pages/<slug>.html           rendered page markup
 *   media/tvs-pages/<slug>.png            full-page screenshot
 *   content/tvs-raw.json                  everything extracted, with source URLs
 *
 * Nothing here writes to content/vehicles.ts. That step is deliberate and
 * manual: figures are cross-checked before they go live.
 */

import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SOURCES = JSON.parse(await readFile(join(ROOT, 'content', 'tvs-sources.json'), 'utf8'));
const ORIGIN = SOURCES.origin;
const OUT_IMAGES = join(ROOT, 'public', 'vehicles');
const OUT_PAGES = join(ROOT, 'media', 'tvs-pages');
const OUT_JSON = join(ROOT, 'content', 'tvs-raw.json');

const ONLY = (process.env.FETCH_ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const MIN_IMAGE_WIDTH = 500;
const MAX_IMAGES_PER_MODEL = 40;

/* ------------------------------------------------------------------ */
/* Sitemap discovery                                                   */
/* ------------------------------------------------------------------ */

async function sitemapUrls(context) {
  const seen = new Set();
  const queue = [`${ORIGIN}/sitemap.xml`, `${ORIGIN}/sitemap_index.xml`, `${ORIGIN}/robots.txt`];
  const urls = new Set();

  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await context.request.get(url, { timeout: 30_000 });
      if (!res.ok()) continue;
      const text = await res.text();
      if (url.endsWith('robots.txt')) {
        for (const m of text.matchAll(/Sitemap:\s*(\S+)/gi)) queue.push(m[1]);
        continue;
      }
      for (const m of text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
        const loc = m[1];
        if (/sitemap[^/]*\.xml$/i.test(loc)) queue.push(loc);
        else if (loc.startsWith(ORIGIN)) urls.add(loc);
      }
    } catch (error) {
      console.warn(`sitemap ${url}: ${error.message}`);
    }
  }
  return [...urls];
}

function pickPage(model, discovered) {
  const candidates = discovered.filter((u) => {
    const path = new URL(u).pathname.toLowerCase();
    return model.match.some((m) => path.includes(m.toLowerCase()));
  });
  // Prefer the shortest matching path: the model landing page, not a
  // sub-page like /specifications or /faq.
  candidates.sort((a, b) => new URL(a).pathname.length - new URL(b).pathname.length);
  return candidates[0] ?? `${ORIGIN}${model.seed}`;
}

/* ------------------------------------------------------------------ */
/* Page extraction — runs inside the browser                           */
/* ------------------------------------------------------------------ */

const EXTRACT = () => {
  const abs = (u) => {
    try { return new URL(u, location.href).href; } catch { return null; }
  };
  const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  // Every image on the page with its rendered size.
  const images = [];
  for (const img of document.querySelectorAll('img, source, picture img')) {
    const rect = img.getBoundingClientRect?.() ?? { width: 0, height: 0 };
    const candidates = [];
    for (const attr of ['src', 'data-src', 'data-lazy-src', 'data-original']) {
      const v = img.getAttribute(attr);
      if (v) candidates.push(v);
    }
    for (const attr of ['srcset', 'data-srcset']) {
      const v = img.getAttribute(attr);
      if (v) for (const part of v.split(',')) candidates.push(part.trim().split(/\s+/)[0]);
    }
    for (const c of candidates) {
      const url = abs(c);
      if (!url || url.startsWith('data:')) continue;
      images.push({
        url,
        alt: img.getAttribute('alt') ?? '',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        naturalWidth: img.naturalWidth ?? 0,
        naturalHeight: img.naturalHeight ?? 0,
        inHero: rect.top < window.innerHeight * 1.5 && rect.width > 200,
      });
    }
  }
  // Background images on large elements.
  for (const el of document.querySelectorAll('[style*="background"]')) {
    const m = /url\(["']?([^"')]+)["']?\)/.exec(el.getAttribute('style') ?? '');
    if (!m) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 300) continue;
    const url = abs(m[1]);
    if (url) images.push({ url, alt: '', width: Math.round(rect.width), height: Math.round(rect.height), naturalWidth: 0, naturalHeight: 0, inHero: rect.top < window.innerHeight * 1.5, background: true });
  }

  // Structured data and meta.
  const jsonLd = [];
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { jsonLd.push(JSON.parse(s.textContent)); } catch { /* ignore */ }
  }
  const meta = {};
  for (const m of document.querySelectorAll('meta[property], meta[name]')) {
    const key = m.getAttribute('property') ?? m.getAttribute('name');
    if (/^(og:|twitter:|description|title)/i.test(key)) meta[key] = m.getAttribute('content');
  }

  // Specification-like rows: tables, definition lists, and label/value pairs.
  const specs = [];
  for (const tr of document.querySelectorAll('table tr')) {
    const cells = [...tr.querySelectorAll('th, td')].map(text).filter(Boolean);
    if (cells.length >= 2) specs.push({ key: cells[0], value: cells.slice(1).join(' | '), via: 'table' });
  }
  for (const dl of document.querySelectorAll('dl')) {
    const dts = [...dl.querySelectorAll('dt')];
    for (const dt of dts) {
      const dd = dt.nextElementSibling;
      if (dd && dd.tagName === 'DD') specs.push({ key: text(dt), value: text(dd), via: 'dl' });
    }
  }
  // Generic "label / value" siblings inside anything named spec*.
  for (const box of document.querySelectorAll('[class*="spec" i], [id*="spec" i]')) {
    for (const row of box.querySelectorAll('li, div')) {
      const kids = [...row.children].filter((k) => text(k));
      if (kids.length === 2 && text(kids[0]).length < 60 && text(kids[1]).length < 120) {
        specs.push({ key: text(kids[0]), value: text(kids[1]), via: 'spec-block' });
      }
    }
  }

  // Colour swatches: anything named colour/color/swatch, plus its text and
  // nearest image. Clicking happens outside, in Node, using these selectors.
  const colours = [];
  const swatchNodes = document.querySelectorAll(
    '[class*="colour" i] [role="button"], [class*="color" i] [role="button"], ' +
    '[class*="swatch" i], [class*="colour" i] li, [class*="color" i] li, ' +
    '[class*="colour" i] button, [class*="color" i] button, ' +
    '[data-color], [data-colour], [data-color-name], [data-colour-name]',
  );
  let index = 0;
  for (const node of swatchNodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const label =
      node.getAttribute('data-color-name') ?? node.getAttribute('data-colour-name') ??
      node.getAttribute('data-color') ?? node.getAttribute('data-colour') ??
      node.getAttribute('aria-label') ?? node.getAttribute('title') ?? text(node);
    const bg = getComputedStyle(node).backgroundColor;
    const img = node.querySelector('img');
    node.setAttribute('data-fetch-swatch', String(index));
    colours.push({
      index,
      label: (label ?? '').slice(0, 80),
      background: bg,
      thumb: img ? abs(img.getAttribute('src') ?? img.getAttribute('data-src') ?? '') : null,
    });
    index += 1;
  }

  // Prices: every rupee figure with a little context either side.
  const body = document.body.innerText ?? '';
  const prices = [];
  for (const m of body.matchAll(/(.{0,80}?)(₹|Rs\.?|INR)\s?([\d,]{4,9})(.{0,60})/g)) {
    prices.push({ before: m[1].trim(), amount: Number(m[3].replace(/,/g, '')), after: m[4].trim() });
  }

  // Variant names: elements named variant*.
  const variants = [];
  for (const el of document.querySelectorAll('[class*="variant" i]')) {
    const t = text(el);
    if (t && t.length < 80) variants.push(t);
  }

  return {
    title: document.title,
    url: location.href,
    meta,
    jsonLd,
    images,
    specs,
    colours,
    prices: prices.slice(0, 200),
    variants: [...new Set(variants)].slice(0, 60),
    headings: [...document.querySelectorAll('h1, h2, h3')].map(text).filter(Boolean).slice(0, 80),
  };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function dismissBanners(page) {
  const labels = /^(accept|accept all|agree|i agree|ok|got it|allow|close|continue)$/i;
  for (const button of await page.locator('button, a[role="button"]').all()) {
    try {
      const t = ((await button.textContent()) ?? '').trim();
      if (labels.test(t) && (await button.isVisible())) {
        await button.click({ timeout: 2000 });
        await page.waitForTimeout(300);
      }
    } catch { /* keep going */ }
  }
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

async function largestHeroImage(page) {
  return page.evaluate(() => {
    let best = null;
    for (const img of document.querySelectorAll('img')) {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight * 1.3 || rect.width < 240) continue;
      const area = rect.width * rect.height;
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:')) continue;
      if (!best || area > best.area) best = { area, src, alt: img.alt ?? '' };
    }
    return best;
  });
}

async function downloadImages(context, model, images) {
  const dir = join(OUT_IMAGES, model.slug);
  const rawDir = join(dir, 'raw');
  await mkdir(rawDir, { recursive: true });

  let sharp = null;
  try { sharp = (await import('sharp')).default; } catch { console.warn('sharp unavailable — keeping originals only'); }

  const saved = [];
  let n = 0;
  for (const image of images) {
    if (n >= MAX_IMAGES_PER_MODEL) break;
    try {
      const res = await context.request.get(image.url, { timeout: 30_000 });
      if (!res.ok()) continue;
      const buffer = Buffer.from(await res.body());
      if (buffer.length < 8_000) continue;
      const ext = (extname(new URL(image.url).pathname) || '.jpg').toLowerCase().slice(0, 5);
      const base = String(n).padStart(2, '0');
      await writeFile(join(rawDir, `${base}${ext}`), buffer);
      let webp = null;
      if (sharp) {
        const meta = await sharp(buffer).metadata();
        if ((meta.width ?? 0) < MIN_IMAGE_WIDTH) continue;
        await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(dir, `${base}.webp`));
        webp = `/vehicles/${model.slug}/${base}.webp`;
        image.naturalWidth = meta.width;
        image.naturalHeight = meta.height;
      }
      saved.push({ ...image, raw: `/vehicles/${model.slug}/raw/${base}${ext}`, webp, bytes: buffer.length });
      n += 1;
    } catch (error) {
      console.warn(`  image ${image.url}: ${error.message}`);
    }
  }
  return saved;
}

/* ------------------------------------------------------------------ */

async function fetchModel(context, model, pageUrl) {
  const page = await context.newPage();
  const result = { slug: model.slug, name: model.name, category: model.category, rank: model.rank, pageUrl, fetchedAt: new Date().toISOString(), status: 'ok' };

  try {
    const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    result.httpStatus = response?.status();
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await dismissBanners(page);
    await scrollThrough(page);
    await page.waitForTimeout(800);

    const extracted = await page.evaluate(EXTRACT);
    Object.assign(result, extracted);

    // Per-colour images: click each swatch and record what the hero becomes.
    const byColour = [];
    for (const colour of extracted.colours.slice(0, 16)) {
      try {
        const swatch = page.locator(`[data-fetch-swatch="${colour.index}"]`).first();
        await swatch.scrollIntoViewIfNeeded({ timeout: 3000 });
        await swatch.click({ timeout: 3000, force: true });
        await page.waitForTimeout(900);
        const hero = await largestHeroImage(page);
        byColour.push({ ...colour, heroImage: hero?.src ?? null, heroAlt: hero?.alt ?? '' });
      } catch (error) {
        byColour.push({ ...colour, heroImage: null, error: error.message.slice(0, 120) });
      }
    }
    result.colours = byColour;

    // Save the page for a human to read when the heuristics miss.
    await mkdir(OUT_PAGES, { recursive: true });
    await writeFile(join(OUT_PAGES, `${model.slug}.html`), await page.content(), 'utf8');
    await page.screenshot({ path: join(OUT_PAGES, `${model.slug}.png`), fullPage: true }).catch(() => {});

    // Download: hero-colour images first, then everything large, deduplicated.
    const wanted = new Map();
    for (const c of byColour) if (c.heroImage) wanted.set(c.heroImage, { url: c.heroImage, alt: c.label, colour: c.label, inHero: true });
    for (const image of extracted.images) {
      const big = Math.max(image.width, image.naturalWidth) >= MIN_IMAGE_WIDTH || image.inHero;
      if (big && !wanted.has(image.url)) wanted.set(image.url, image);
    }
    result.images = await downloadImages(context, model, [...wanted.values()]);
  } catch (error) {
    result.status = 'error';
    result.error = error.message.slice(0, 300);
  } finally {
    await page.close();
  }

  console.log(`  ${model.slug.padEnd(20)} ${result.status.padEnd(6)} ${result.images?.length ?? 0} img  ${result.colours?.length ?? 0} col  ${result.specs?.length ?? 0} spec  ${result.prices?.length ?? 0} ₹`);
  return result;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
  });

  console.log('Reading sitemap…');
  const discovered = await sitemapUrls(context);
  console.log(`  ${discovered.length} URLs on ${ORIGIN}`);

  const models = SOURCES.models.filter((m) => ONLY.length === 0 || ONLY.includes(m.slug));
  const results = [];
  for (const model of models) {
    const pageUrl = pickPage(model, discovered);
    results.push(await fetchModel(context, model, pageUrl));
  }

  await browser.close();

  const previous = existsSync(OUT_JSON) ? JSON.parse(await readFile(OUT_JSON, 'utf8')) : { models: [] };
  const merged = ONLY.length
    ? { ...previous, models: [...previous.models.filter((m) => !ONLY.includes(m.slug)), ...results] }
    : { origin: ORIGIN, fetchedAt: new Date().toISOString(), discoveredUrls: discovered.length, models: results };

  await writeFile(OUT_JSON, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`\nWrote ${OUT_JSON}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
