/**
 * A second, narrower pass for the models whose photography is still thin.
 *
 * Fourteen models have no per-colour photograph, and eight of those have nothing
 * but the navigation's 372px studio shot. On a card that is acceptable; on a
 * model page, where the stage is up to 700px wide, a 372px image is visibly
 * soft. This goes back for those specific models.
 *
 * It discovers and downloads in one browser session, unlike the first pipeline,
 * because the images it is after are the ones that only exist after JavaScript
 * has run — which is exactly why reading the saved HTML offline did not find
 * them. It scrolls the page, opens the colour section, and then takes every
 * image the browser actually rendered at a usable size.
 *
 *   SLUGS=ronin,tvs-x node scripts/fetch-model-images.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'vehicles');
const SOURCES = JSON.parse(await readFile(path.join(ROOT, 'content', 'tvs-sources.json'), 'utf8'));
const EXISTING = JSON.parse(await readFile(path.join(ROOT, 'content', 'tvs-images.json'), 'utf8'));

/** Models to revisit. Defaults to every model with no colour photograph. */
const SLUGS = (process.env.SLUGS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const targets =
  SLUGS.length > 0
    ? SLUGS
    : Object.entries(EXISTING.models)
        .filter(([, m]) => m.colours.length === 0)
        .map(([slug]) => slug);

/** The URL the first pass actually landed on, recorded in tvs-sources.json. */
const pageUrl = (slug) => {
  const entry = SOURCES.models.find((m) => m.slug === slug);
  if (!entry) return null;
  return entry.resolved ?? `${SOURCES.origin}${entry.seed}`;
};

/** A whole-vehicle shot is wide, big, and not a banner strip or an icon. */
const MIN_WIDTH = 560;
const MIN_HEIGHT = 300;
const MAX_ASPECT = 2.6;
const PER_MODEL = 5;

const REJECT = /(icon|logo|arrow|navbar|footer|country|flag|social|play|download|badge|bank|sprite|placeholder|loader|preloader)/i;

async function collect(page) {
  return page.evaluate(
    ({ minW, minH, maxAspect, reject }) => {
      const re = new RegExp(reject, 'i');
      const seen = new Map();

      const consider = (url, w, h) => {
        if (!url || !/^https?:/.test(url)) return;
        if (re.test(url)) return;
        if (w < minW || h < minH) return;
        const aspect = w / h;
        if (aspect > maxAspect || aspect < 0.55) return;
        const score = w * h;
        const prev = seen.get(url);
        if (!prev || prev.score < score) seen.set(url, { url, width: w, height: h, score });
      };

      for (const img of document.querySelectorAll('img')) {
        // naturalWidth is the file's real size, not the box it is drawn in.
        consider(img.currentSrc || img.src, img.naturalWidth, img.naturalHeight);
      }
      for (const el of document.querySelectorAll('*')) {
        const bg = getComputedStyle(el).backgroundImage;
        const m = /url\(["']?(https?:[^"')]+)["']?\)/.exec(bg);
        if (m) consider(m[1], el.clientWidth * 2, el.clientHeight * 2);
      }
      return [...seen.values()].sort((a, b) => b.score - a.score);
    },
    { minW: MIN_WIDTH, minH: MIN_HEIGHT, maxAspect: MAX_ASPECT, reject: REJECT.source },
  );
}

async function fetchInPage({ url, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { credentials: 'include', signal: controller.signal });
    if (!response.ok) return { error: `HTTP ${response.status}` };
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 2048) return { error: `too small (${buffer.byteLength} bytes)` };
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { base64: btoa(binary) };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-IN' });
const page = await context.newPage();

const report = {};
console.log(`revisiting ${targets.length} model(s): ${targets.join(', ')}\n`);

for (const slug of targets) {
  const url = pageUrl(slug);
  if (!url) {
    console.warn(`  ${slug}: no page URL`);
    continue;
  }

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2500);

    // Scroll the whole page so lazy images resolve, then come back up.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 280));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2000);

    const found = (await collect(page)).slice(0, PER_MODEL);
    console.log(`  ${slug}: ${found.length} candidate(s)`);

    const dir = path.join(OUT, slug);
    await mkdir(dir, { recursive: true });
    const saved = [];

    for (const [i, candidate] of found.entries()) {
      const got = await page
        .evaluate(fetchInPage, { url: candidate.url, timeoutMs: 30_000 })
        .catch((e) => ({ error: String(e?.message ?? e) }));
      if (got.error) {
        console.warn(`     skip ${candidate.width}x${candidate.height}  ${got.error}`);
        continue;
      }
      const raw = Buffer.from(got.base64, 'base64');
      const image = sharp(raw).rotate();
      const meta = await image.metadata();
      if (!meta.width || meta.width < MIN_WIDTH) continue;

      const name = `alt-${i + 1}`;
      const width = Math.min(meta.width, 1400);
      await image.resize({ width }).webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
      saved.push({ name, url: candidate.url, width, height: Math.round((meta.height / meta.width) * width) });
      console.log(`     ok   ${name}  ${width}x${Math.round((meta.height / meta.width) * width)}`);
    }
    report[slug] = saved;
  } catch (error) {
    console.warn(`  ${slug}: ${error.message ?? error}`);
    report[slug] = [];
  }
}

await browser.close();
await writeFile(path.join(ROOT, 'content', 'tvs-alt-images.json'), JSON.stringify({ ranAt: new Date().toISOString(), report }, null, 2) + '\n');
const total = Object.values(report).reduce((n, x) => n + x.length, 0);
console.log(`\n${total} image(s) saved across ${Object.keys(report).length} model(s)`);
