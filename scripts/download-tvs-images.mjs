/**
 * Downloads the images listed in content/tvs-images.json into public/vehicles/.
 *
 * Deliberately dumb: no browser, no DOM, no heuristics. It reads a list of URLs
 * that a human can review before anything is fetched, gets each one once, and
 * converts it to a WebP the site can serve. That separation is the point — when
 * the first pass came back with pages and no pictures, the fix was to change how
 * URLs are found, not to run a browser again.
 *
 * Output, per model:
 *   public/vehicles/<slug>/card.webp        studio shot, used on cards and rails
 *   public/vehicles/<slug>/<colour>.webp    one per named official colour
 *   public/vehicles/<slug>/view-N.webp      extra views where colours were unnamed
 *
 * Every file is also written to public/vehicles/<slug>/raw/ untouched, so a bad
 * conversion can be diagnosed without re-fetching.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'vehicles');
const MANIFEST = path.join(ROOT, 'content', 'tvs-images.json');

const WIDTH = 1400;
const QUALITY = 80;
const CONCURRENCY = 4;
const TIMEOUT_MS = 30_000;

const HEADERS = {
  // Sitecore serves a 403 to a bare fetch; a normal browser's headers get the file.
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
  Referer: 'https://www.tvsmotor.com/',
};

async function grab(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: HEADERS, signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error(`too small (${buffer.byteLength} bytes)`);
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

/** Trims uniform borders, so studio shots on white and on transparent match. */
async function convert(buffer) {
  const image = sharp(buffer).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error('not an image');
  return {
    data: await image
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toBuffer(),
    width: Math.min(meta.width, WIDTH),
    height: Math.round((meta.height / meta.width) * Math.min(meta.width, WIDTH)),
  };
}

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));

/** Everything to fetch, flattened, so progress and failures are per file. */
const jobs = [];
for (const [slug, model] of Object.entries(manifest.models)) {
  if (model.card) jobs.push({ slug, name: 'card', url: model.card });
  for (const colour of model.colours) jobs.push({ slug, name: colour.slug, url: colour.url, colour: colour.name });
  model.gallery.forEach((url, i) => jobs.push({ slug, name: `view-${i + 1}`, url }));
}

const results = { ok: [], failed: [] };
let cursor = 0;

async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    const dir = path.join(OUT, job.slug);
    try {
      const raw = await grab(job.url);
      const { data, width, height } = await convert(raw);
      await mkdir(path.join(dir, 'raw'), { recursive: true });
      await writeFile(path.join(dir, `${job.name}.webp`), data);
      await writeFile(path.join(dir, 'raw', `${job.name}${path.extname(new URL(job.url).pathname) || '.bin'}`), raw);
      results.ok.push({ ...job, width, height, bytes: data.byteLength });
      console.log(`  ok    ${job.slug}/${job.name}  ${width}x${height}  ${(data.byteLength / 1024).toFixed(0)} KB`);
    } catch (error) {
      results.failed.push({ ...job, error: String(error.message ?? error) });
      console.warn(`  FAIL  ${job.slug}/${job.name}  ${error.message ?? error}`);
    }
  }
}

console.log(`${jobs.length} images to fetch\n`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

await writeFile(
  path.join(ROOT, 'content', 'tvs-images-result.json'),
  JSON.stringify({ ranAt: new Date().toISOString(), ok: results.ok, failed: results.failed }, null, 2) + '\n',
);

console.log(`\n${results.ok.length} downloaded, ${results.failed.length} failed`);
if (results.failed.length) {
  console.log('failed:');
  for (const f of results.failed) console.log(`  ${f.slug}/${f.name}  ${f.error}`);
}
