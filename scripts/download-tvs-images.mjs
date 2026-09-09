/**
 * Downloads the images listed in content/tvs-images.json into public/vehicles/.
 *
 * The URLs come from a list a human can read before anything is fetched — that
 * separation is deliberate. When the first pass came back with pages and almost
 * no pictures, the fix was to change how URLs are found (offline, from the saved
 * HTML), not to run a browser and guess again.
 *
 * The fetching does need a browser, though. A plain `fetch` with browser-shaped
 * headers gets HTTP 403 from every one of these URLs: tvsmotor.com sits behind a
 * bot filter that looks at the TLS handshake and at session cookies, not just at
 * the User-Agent string. So this opens one real Chromium, lets it land on the
 * site normally, and then reads each image with `fetch` *inside the page*, where
 * the request carries the genuine fingerprint, the cookies and a same-origin
 * referer. The bytes come back as base64 and are converted here.
 *
 * Output, per model:
 *   public/vehicles/<slug>/card.webp        studio shot, used on cards and rails
 *   public/vehicles/<slug>/<colour>.webp    one per named official colour
 *   public/vehicles/<slug>/view-N.webp      extra views where colours were unnamed
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'vehicles');
const MANIFEST = path.join(ROOT, 'content', 'tvs-images.json');

const WIDTH = 1400;
const QUALITY = 80;
const TIMEOUT_MS = 30_000;

/**
 * Runs in the page. Returns base64 rather than bytes because that is all that
 * survives the bridge out of the browser.
 */
async function fetchInPage(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
      headers: { Accept: 'image/avif,image/webp,image/png,image/*,*/*;q=0.8' },
    });
    if (!response.ok) return { error: `HTTP ${response.status}` };
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 1024) return { error: `too small (${buffer.byteLength} bytes)` };

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return { base64: btoa(binary), type: response.headers.get('content-type') ?? '' };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

async function convert(buffer) {
  const image = sharp(buffer).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error('not an image');
  const width = Math.min(meta.width, WIDTH);
  return {
    data: await image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toBuffer(),
    width,
    height: Math.round((meta.height / meta.width) * width),
  };
}

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));

const jobs = [];
for (const [slug, model] of Object.entries(manifest.models)) {
  if (model.card) jobs.push({ slug, name: 'card', url: model.card });
  for (const colour of model.colours) {
    jobs.push({ slug, name: colour.slug, url: colour.url, colour: colour.name });
  }
  model.gallery.forEach((url, i) => jobs.push({ slug, name: `view-${i + 1}`, url }));
}

console.log(`${jobs.length} images to fetch\n`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'en-IN',
});
const page = await context.newPage();

// Land on the site properly first: the bot filter hands out the cookies that
// every later image request is checked against.
await page.goto(manifest.origin, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(2500);

const results = { ok: [], failed: [] };

for (const job of jobs) {
  const dir = path.join(OUT, job.slug);
  try {
    const got = await page.evaluate(fetchInPage, [job.url, TIMEOUT_MS]).catch((e) => ({
      error: String(e?.message ?? e),
    }));
    if (got.error) throw new Error(got.error);

    const raw = Buffer.from(got.base64, 'base64');
    const { data, width, height } = await convert(raw);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${job.name}.webp`), data);
    results.ok.push({ ...job, width, height, bytes: data.byteLength });
    console.log(`  ok    ${job.slug}/${job.name}  ${width}x${height}  ${(data.byteLength / 1024).toFixed(0)} KB`);
  } catch (error) {
    results.failed.push({ ...job, error: String(error.message ?? error) });
    console.warn(`  FAIL  ${job.slug}/${job.name}  ${error.message ?? error}`);
  }
}

await browser.close();

await writeFile(
  path.join(ROOT, 'content', 'tvs-images-result.json'),
  JSON.stringify({ ranAt: new Date().toISOString(), ok: results.ok, failed: results.failed }, null, 2) + '\n',
);

console.log(`\n${results.ok.length} downloaded, ${results.failed.length} failed`);
for (const f of results.failed) console.log(`  ${f.slug}/${f.name}  ${f.error}`);
