/**
 * Turns the dealership's raw uploads in media/ into the web assets under public/.
 *
 * Nothing in media/ is served. This script is the only path from a raw phone
 * photo to something the site loads, so re-running it after the owner uploads
 * more files is the whole workflow:  npm run media
 *
 * Every output is deterministic, so the script is safe to run repeatedly.
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = process.cwd();
const RAW = path.join(ROOT, 'media', 'photos');
const RAWVID = path.join(ROOT, 'media', 'video');
const OUT = path.join(ROOT, 'public', 'photos');
const OUTVID = path.join(ROOT, 'public', 'video');

/** Widths emitted for every photo; the largest is the intrinsic size we record. */
const WIDTHS = [1600, 1200, 800, 480];

/**
 * The curated set. `crop` is a gravity hint for the wide renditions; `alt` is
 * the English alt text (the Hindi one lives in content/copy/hi.ts keyed by id).
 */
const PHOTOS = [
  {
    id: 'hero-raider',
    src: 'WhatsApp Image 2026-09-09 at 2.42.03 AM.jpeg',
    alt: 'A red and black TVS Raider on the showroom floor at Shiv Kripa Motors, with more bikes lined up behind it.',
  },
  {
    id: 'hero-floor',
    src: 'WhatsApp Image 2026-09-09 at 2.42.04 AM (1).jpeg',
    alt: 'A row of new TVS Raider and Apache motorcycles lined up along the showroom floor.',
    // The phone hero displays this at 4:5. Shipping the full 9:16 frame and
    // letting CSS crop it wastes about a third of the pixels on the largest
    // image on the page, which is also the one Largest Contentful Paint waits
    // for. Cropped here instead, and slightly softer: it is a hand-held photo
    // of a showroom floor, not a product shot with edges to hold.
    crop: 4 / 5,
    quality: 62,
  },
  {
    id: 'storefront',
    src: 'WhatsApp Image 2026-09-09 at 2.42.05 AM (1).jpeg',
    alt: 'The Shiv Kripa Motors showroom front on Bilaspur Road, Kota, under the TVS dealer sign.',
  },
  {
    id: 'opening-day',
    src: 'WhatsApp Image 2026-09-09 at 2.42.07 AM (1).jpeg',
    alt: 'The Shiv Kripa Motors team outside the showroom on opening day.',
  },
  {
    id: 'opening-floor',
    src: 'WhatsApp Image 2026-09-09 at 2.42.01 AM.jpeg',
    alt: 'The showroom on opening day, scooters and motorcycles ready on the floor behind the ribbon.',
  },
  {
    id: 'first-delivery',
    src: 'WhatsApp Image 2026-09-09 at 2.42.05 AM.jpeg',
    alt: 'A new TVS Jupiter being handed over to its owner at the showroom.',
  },
  {
    id: 'scooters',
    src: 'WhatsApp Image 2026-09-09 at 2.42.05 AM (2).jpeg',
    alt: 'Two TVS scooters parked side by side inside the showroom.',
  },
];

/** The one clip worth loading: a steady pan across the bikes on the floor. */
const CLIP = {
  src: 'WhatsApp Video 2026-09-09 at 2.43.50 AM.mp4',
  start: 18,
  duration: 7,
  posterAt: 2.4,
};

const exists = (p) => access(p).then(() => true, () => false);

async function photos() {
  await mkdir(OUT, { recursive: true });
  const manifest = [];

  for (const p of PHOTOS) {
    const file = path.join(RAW, p.src);
    if (!(await exists(file))) {
      console.warn(`  skip ${p.id} — missing ${p.src}`);
      continue;
    }
    const input = sharp(file).rotate(); // honour EXIF orientation
    const meta = await input.metadata();
    const quality = p.quality ?? 78;

    // A cropped photo's usable width is bounded by what the crop can take from
    // the original without upscaling.
    const sourceWidth = p.crop
      ? Math.min(meta.width, Math.round(meta.height * p.crop))
      : meta.width;
    const widths = WIDTHS.filter((w) => w <= sourceWidth);
    // Nothing is upscaled, so when the original falls between tiers the original
    // width itself becomes the top rendition rather than losing detail to 800.
    if (widths[0] !== sourceWidth) widths.unshift(sourceWidth);

    for (const w of widths) {
      const dest = path.join(OUT, `${p.id}-${w}.webp`);
      const resize = p.crop
        ? { width: w, height: Math.round(w / p.crop), fit: 'cover', position: 'centre' }
        : { width: w, withoutEnlargement: true };
      await sharp(file).rotate().resize(resize).webp({ quality, effort: 6 }).toFile(dest);
    }

    // A 24px-wide blur used as the CSS background under the image while it loads.
    const lqip = await sharp(file)
      .rotate()
      .resize(
        p.crop
          ? { width: 24, height: Math.round(24 / p.crop), fit: 'cover', position: 'centre' }
          : { width: 24 },
      )
      .webp({ quality: 40 })
      .toBuffer();

    const largest = Math.max(...widths);
    const height = p.crop
      ? Math.round(largest / p.crop)
      : Math.round((meta.height / meta.width) * largest);
    manifest.push({
      id: p.id,
      alt: p.alt,
      width: largest,
      height,
      widths,
      blur: `data:image/webp;base64,${lqip.toString('base64')}`,
    });
    console.log(`  ${p.id}  ${meta.width}x${meta.height} -> ${widths.join(', ')}`);
  }
  return manifest;
}

async function clip() {
  const file = path.join(RAWVID, CLIP.src);
  if (!(await exists(file))) {
    console.warn(`  skip clip — missing ${CLIP.src}`);
    return null;
  }
  await mkdir(OUTVID, { recursive: true });
  const mp4 = path.join(OUTVID, 'showroom.mp4');

  // Silent, faststart, CRF 30 at 1024x576: about 1.3 MB for seven seconds, and
  // it only ever loads on a wide viewport that has not asked for reduced motion.
  await run('ffmpeg', [
    '-v', 'error', '-y',
    '-ss', String(CLIP.start), '-t', String(CLIP.duration),
    '-i', file,
    '-an',
    '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-crf', '30', '-preset', 'slow',
    '-movflags', '+faststart',
    '-vf', 'scale=1024:576',
    mp4,
  ]);

  const poster = path.join(ROOT, 'public', 'photos', 'showroom-clip-1200.webp');
  const tmp = path.join(ROOT, 'public', 'video', '.poster.png');
  await run('ffmpeg', [
    '-v', 'error', '-y',
    '-ss', String(CLIP.start + CLIP.posterAt), '-i', file,
    '-frames:v', '1', tmp,
  ]);
  await sharp(tmp).resize({ width: 1200 }).webp({ quality: 78 }).toFile(poster);
  const blur = await sharp(tmp).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  await run('rm', ['-f', tmp]);

  const { size } = await import('node:fs').then((fs) => fs.promises.stat(mp4));
  console.log(`  showroom.mp4  ${(size / 1024 / 1024).toFixed(2)} MB`);
  return { blur: `data:image/webp;base64,${blur.toString('base64')}` };
}

const header = `// GENERATED by scripts/curate-media.mjs — do not edit by hand.
// Source files live in media/. Re-run \`npm run media\` after new uploads.
`;

console.log('photos');
const manifest = await photos();
console.log('video');
const video = await clip();

const ts =
  header +
  `
export type Photo = {
  /** Stem of the files in /photos: \`\${id}-\${width}.webp\`. */
  id: string;
  /** English alt text. Hindi alt text is keyed by id in content/copy/hi.ts. */
  alt: string;
  /** Intrinsic size of the largest rendition, for width/height attributes. */
  width: number;
  height: number;
  /** Widths actually emitted, largest first, for the srcset. */
  widths: number[];
  /** 24px WebP data URI, painted under the image while it loads. */
  blur: string;
};

export const photos = ${JSON.stringify(
    Object.fromEntries(manifest.map((m) => [m.id, { ...m, widths: [...m.widths].sort((a, b) => b - a) }])),
    null,
    2,
  )} as const satisfies Record<string, Photo>;

export type PhotoId = keyof typeof photos;

/** \`srcset\` for a curated photo, in the order browsers expect. */
export function srcSet(id: PhotoId): string {
  return photos[id].widths.map((w) => \`/photos/\${id}-\${w}.webp \${w}w\`).join(', ');
}

/** Largest rendition, used as the \`src\` fallback. */
export function src(id: PhotoId): string {
  return \`/photos/\${id}-\${photos[id].widths[0]}.webp\`;
}

/** The showroom clip: desktop-only, muted, seven seconds, no audio track. */
export const showroomClip = ${JSON.stringify(
    video
      ? {
          src: '/video/showroom.mp4',
          poster: '/photos/showroom-clip-1200.webp',
          width: 1024,
          height: 576,
          blur: video.blur,
        }
      : null,
    null,
    2,
  )};
`;

await writeFile(path.join(ROOT, 'content', 'photos.ts'), ts);
console.log('wrote content/photos.ts');
