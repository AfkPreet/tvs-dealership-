/**
 * Builds the two tiny fonts that hold nothing but the rupee sign.
 *
 * The site renders exactly one character outside Google's base latin subset:
 * ₹, U+20B9. It falls inside the latin-ext range, so a single rupee sign on a
 * price pulls Inter's latin-ext file (83KB) and Bricolage's (18KB) on every
 * page — 101KB for one glyph, and it was the largest thing on the page after
 * the hero photograph.
 *
 * Rather than drop the symbol for "Rs", this cuts ₹ out of those very files.
 * The result is about a kilobyte each, declared first in the font stack with
 * `unicode-range: U+20B9`, so the browser takes ₹ from here and everything else
 * still falls through to Inter and Bricolage exactly as before.
 *
 * Run it after a build (the source files are Next's hashed font output) and
 * commit the result. It is not part of the build: the output is stable, and a
 * build should not depend on a Python toolchain.
 *
 *   npm run build && node scripts/build-rupee-font.mjs
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const MEDIA = path.join(process.cwd(), 'out', '_next', 'static', 'media');
const CSS_DIR = path.join(process.cwd(), 'out', '_next', 'static', 'chunks');
const OUT = path.join(process.cwd(), 'public', 'fonts');

/** The latin-ext range, as Google writes it — the marker for the file we want. */
const LATIN_EXT_MARK = 'U+1E00-1E9F';

const cssFile = (await readdir(CSS_DIR)).find((f) => f.endsWith('.css'));
if (!cssFile) throw new Error('no built CSS — run `npm run build` first');
const css = await readFile(path.join(CSS_DIR, cssFile), 'utf8');

const wanted = { Inter: 'rupee-inter', 'Bricolage Grotesque': 'rupee-display' };
const found = {};

for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
  if (!block.includes(LATIN_EXT_MARK)) continue;
  const family = /font-family:\s*([^;}]+)/.exec(block)?.[1]?.trim().replace(/['"]/g, '');
  const file = /media\/([A-Za-z0-9_.\-]+\.woff2)/.exec(block)?.[1];
  if (!family || !file || !(family in wanted)) continue;
  found[family] = file;
}

await mkdir(OUT, { recursive: true });

for (const [family, name] of Object.entries(wanted)) {
  const file = found[family];
  if (!file) {
    console.warn(`  no latin-ext file found for ${family} — skipping`);
    continue;
  }
  const source = path.join(MEDIA, file);
  const dest = path.join(OUT, `${name}.woff2`);

  await run('python3', [
    '-m', 'fontTools.subset', source,
    '--unicodes=U+20B9',
    '--flavor=woff2',
    '--layout-features=',
    '--no-hinting',
    '--desubroutinize',
    `--output-file=${dest}`,
  ]);

  const { size } = await import('node:fs').then((fs) => fs.promises.stat(dest));
  const before = await readFile(source).then((b) => b.byteLength);
  console.log(`  ${name}.woff2  ${(size / 1024).toFixed(1)} KB  (from ${(before / 1024).toFixed(0)} KB ${family} latin-ext)`);
}
