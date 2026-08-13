/**
 * Lighthouse run against the static export, mobile and desktop.
 *
 * Performance is part of the pitch, so it gets measured rather than assumed.
 * Writes an HTML report per run into .audit/ and prints the four category
 * scores. The gate from the brief: mobile Performance ≥ 95 and Accessibility
 * 100; desktop Performance ≥ 90.
 *
 * Run: node scripts/lighthouse.mjs [url-path ...]
 */

import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib';

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt']);

/**
 * Vercel serves every text asset with Brotli or gzip. Measuring against an
 * uncompressed local server charges Lighthouse ~5x the real transfer size and
 * produces a score the production site would never earn, so the harness
 * compresses exactly as the host does.
 */
function compress(buffer, ext, acceptEncoding = '') {
  if (!COMPRESSIBLE.has(ext)) return { body: buffer, encoding: null };
  if (acceptEncoding.includes('br')) {
    return {
      body: brotliCompressSync(buffer, {
        params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 },
      }),
      encoding: 'br',
    };
  }
  if (acceptEncoding.includes('gzip')) return { body: gzipSync(buffer), encoding: 'gzip' };
  return { body: buffer, encoding: null };
}


const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'out');
const REPORTS = join(ROOT, '.audit');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function serve(port) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let path = join(OUT, decodeURIComponent(url.pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path) && existsSync(`${path}.html`)) path = `${path}.html`;
    if (!existsSync(path)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const buffer = await readFile(path);
    const { body, encoding } = compress(buffer, extname(path), req.headers['accept-encoding'] ?? '');
    res.writeHead(200, {
      'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
      vary: 'accept-encoding',
      ...(encoding ? { 'content-encoding': encoding } : {}),
      // Match what Vercel serves for immutable build output.
      'cache-control': path.includes('/_next/static/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    });
    res.end(body);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PATHS = args.length ? args : ['/', '/vehicles/', '/vehicles/jupiter-125/', '/finance/', '/service/'];

/**
 * Lighthouse's default throttling is *simulated* (Lantern): it loads the page
 * unthrottled and then models what a 1.6 Mbps / 150 ms / 4x-CPU device would
 * have done. `--real` instead applies that throttling to the browser for real
 * and measures the outcome. Both are reported, because they disagree here and
 * the disagreement is worth being straight about: Lantern's model charges this
 * page a large LCP that the throttled browser does not reproduce.
 */
const REAL = process.argv.includes('--real');

async function main() {
  await mkdir(REPORTS, { recursive: true });
  const port = 8125;
  const server = await serve(port);

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--remote-debugging-port=9222'],
  });

  const rows = [];

  for (const preset of ['mobile', 'desktop']) {
    for (const path of PATHS) {
      const result = await lighthouse(
        `http://127.0.0.1:${port}${path}`,
        { port: 9222, output: 'html', logLevel: 'error' },
        preset === 'desktop'
          ? {
              extends: 'lighthouse:default',
              settings: {
                formFactor: 'desktop',
                screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1 },
                throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
                ...(REAL ? { throttlingMethod: 'devtools' } : {}),
              },
            }
          : REAL
            ? { extends: 'lighthouse:default', settings: { throttlingMethod: 'devtools' } }
            : undefined,
      );

      const scores = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
      );

      const name = `lh-${preset}${REAL ? '-real' : ''}-${path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'}`;
      await writeFile(join(REPORTS, `${name}.html`), result.report);
      rows.push({ preset, path, ...scores });
    }
  }

  await browser.close();
  server.close();

  console.log(`\nThrottling: ${REAL ? 'devtools (applied for real)' : 'simulated (Lighthouse default)'}`);
  const pad = (value, width) => String(value).padEnd(width);
  console.log(
    `\n${pad('form', 8)}${pad('page', 26)}${pad('perf', 6)}${pad('a11y', 6)}${pad('bp', 6)}seo`,
  );
  for (const row of rows) {
    console.log(
      `${pad(row.preset, 8)}${pad(row.path, 26)}${pad(row.performance, 6)}${pad(
        row.accessibility,
        6,
      )}${pad(row['best-practices'], 6)}${row.seo}`,
    );
  }

  const failures = rows.filter((row) =>
    row.preset === 'mobile'
      ? row.performance < 95 || row.accessibility < 100
      : row.performance < 90 || row.accessibility < 100,
  );

  console.log(
    failures.length === 0
      ? '\nAll pages clear the performance and accessibility gate.'
      : `\n${failures.length} page(s) below the gate — cut motion until they are not.`,
  );
  console.log(`Reports in ${REPORTS}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
