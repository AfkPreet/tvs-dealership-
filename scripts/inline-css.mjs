/**
 * Post-export step: inline the stylesheet into every exported document.
 *
 * The build produces a single small stylesheet, and it was the only
 * render-blocking request left on the page. Discovering it costs a second round
 * trip — on the 150ms-RTT 4G this audience is actually on, that round trip is
 * worth more than the ~7KB (compressed) the CSS adds to each document.
 *
 * The trade is deliberate and it favours this audience: most visitors arrive
 * from a WhatsApp forward or a Maps listing, so they are on a first, cold visit
 * where there is no cached stylesheet to reuse. Repeat visitors pay the CSS
 * bytes again; first-time visitors — the ones we are trying to convert — get
 * their first paint a round trip sooner.
 *
 * The `<link>` is kept as a `preload` so the file still lands in the HTTP cache
 * for subsequent navigations.
 *
 * Run: npm run build (wired in as a postbuild step)
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const OUT = new URL('../out', import.meta.url).pathname;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (extname(path) === '.html') yield path;
  }
}

const LINK_RE = /<link rel="stylesheet" href="(\/_next\/static\/css\/[^"]+)"[^>]*\/?>/g;

async function main() {
  const cache = new Map();
  let documents = 0;
  let inlined = 0;

  for await (const file of walk(OUT)) {
    const html = await readFile(file, 'utf8');
    const matches = [...html.matchAll(LINK_RE)];
    if (matches.length === 0) continue;

    let next = html;
    for (const [tag, href] of matches) {
      if (!cache.has(href)) {
        cache.set(href, await readFile(join(OUT, href), 'utf8'));
      }
      const css = cache.get(href);
      // Keep the file cacheable for the next navigation, but stop it blocking
      // this one.
      next = next.replace(
        tag,
        `<link rel="preload" as="style" href="${href}"><style>${css}</style>`,
      );
      inlined += 1;
    }

    await writeFile(file, next, 'utf8');
    documents += 1;
  }

  console.log(`Inlined ${cache.size} stylesheet(s) into ${documents} document(s) (${inlined} link(s) replaced).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
