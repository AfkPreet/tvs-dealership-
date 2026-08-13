/**
 * Renders the Lighthouse score summary as a single image to send with the sample.
 *
 * Reads the reports scripts/lighthouse.mjs wrote into .audit/ and screenshots
 * their score gauges side by side. Both throttling modes are shown, because they
 * disagree and the honest thing is to show both rather than pick the flattering
 * one.
 *
 * Run: node scripts/lighthouse.mjs && node scripts/lighthouse.mjs --real && node scripts/score-card.mjs
 */

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const REPORTS = new URL('../.audit', import.meta.url).pathname;

const ROWS = [
  { file: 'lh-mobile-home.html', form: 'Mobile', mode: 'Simulated throttling (Lighthouse default)' },
  { file: 'lh-desktop-home.html', form: 'Desktop', mode: 'Simulated throttling (Lighthouse default)' },
  { file: 'lh-mobile-real-home.html', form: 'Mobile', mode: 'Applied throttling (devtools)' },
  { file: 'lh-desktop-real-home.html', form: 'Desktop', mode: 'Applied throttling (devtools)' },
];

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const LABELS = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

function scoresFrom(html) {
  // The HTML report embeds the full LHR as a JSON blob.
  const match = /window\.__LIGHTHOUSE_JSON__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/.exec(html);
  if (!match) return null;
  const lhr = JSON.parse(match[1]);
  return Object.fromEntries(
    CATEGORIES.map((key) => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)]),
  );
}

const band = (score) => (score >= 90 ? '#0f7a46' : score >= 50 ? '#b26a00' : '#c4132a');

async function main() {
  const rows = [];
  for (const row of ROWS) {
    const path = join(REPORTS, row.file);
    if (!existsSync(path)) continue;
    const scores = scoresFrom(await readFile(path, 'utf8'));
    if (scores) rows.push({ ...row, scores });
  }

  if (rows.length === 0) throw new Error('No Lighthouse reports found — run scripts/lighthouse.mjs first.');

  const groups = [...new Set(rows.map((r) => r.mode))];

  const html = `<!doctype html><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{font:16px/1.4 system-ui,sans-serif;background:#fff;color:#0E0E10;padding:40px;width:1000px}
  h1{font-size:26px;letter-spacing:-0.02em;font-weight:800}
  .sub{color:#6B6F77;margin-top:6px;font-size:14px;max-width:70ch}
  section{margin-top:34px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:#6B6F77;font-weight:700}
  .row{display:flex;align-items:center;gap:28px;border-top:1px solid #D9DBE0;padding:18px 0}
  .form{width:96px;font-weight:700;font-size:18px}
  .gauges{display:flex;gap:34px}
  .g{text-align:center;width:110px}
  .n{font-size:34px;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
  .l{font-size:12px;color:#6B6F77;margin-top:2px}
  footer{margin-top:34px;border-top:1px solid #D9DBE0;padding-top:14px;font-size:12px;color:#6B6F77}
  </style>
  <h1>Shakti Motors — Lighthouse</h1>
  <p class="sub">Measured against the static export, served with Brotli, on the home page.</p>
  ${groups
    .map(
      (mode) => `<section><h2>${mode}</h2>${rows
        .filter((r) => r.mode === mode)
        .map(
          (r) => `<div class="row"><div class="form">${r.form}</div><div class="gauges">${CATEGORIES.map(
            (key) =>
              `<div class="g"><div class="n" style="color:${band(r.scores[key])}">${r.scores[key]}</div><div class="l">${LABELS[key]}</div></div>`,
          ).join('')}</div></div>`,
        )
        .join('')}</section>`,
    )
    .join('')}
  <footer>Lighthouse's default throttling is a model, not a measurement: it loads the page unthrottled and simulates a slow device. Applied throttling actually slows the browser and measures the result. The two disagree on this page, so both are shown.</footer>`;

  const file = join(REPORTS, 'lighthouse-scores.html');
  await writeFile(file, html, 'utf8');

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 });
  await page.goto(`file://${file}`);
  await page.screenshot({ path: join(REPORTS, 'lighthouse-scores.png'), fullPage: true });
  await browser.close();

  console.log(`Wrote ${join(REPORTS, 'lighthouse-scores.png')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
