/**
 * Checks the deployed site, from somewhere that can actually reach it.
 *
 * The development sandbox's proxy blocks vercel.app, so everything up to now has
 * been verified against a local build of the same export. That is close, but it
 * is not the thing the customer loads: it does not prove the routes resolve on
 * the platform, that the photographs and the clip are actually being served, or
 * what the numbers look like over a real network.
 *
 * Writes live-check.md for the workflow summary and leaves screenshots behind.
 */
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const SITE = (process.env.SITE ?? 'https://tvs-dealership-preved.vercel.app').replace(/\/$/, '');

const ROUTES = [
  { path: '/', expect: 'Shiv Kripa Motors' },
  { path: '/vehicles/', expect: 'Every TVS model' },
  { path: '/vehicles/raider-125/', expect: 'Raider' },
  { path: '/vehicles/jupiter-110/', expect: 'Jupiter' },
  { path: '/finance/', expect: 'EMI' },
  { path: '/service/', expect: 'service' },
  { path: '/about/', expect: 'showroom' },
];

/** Assets that should exist. A 404 here means the export shipped a dead path. */
const ASSETS = [
  '/photos/hero-raider-1600.webp',
  '/photos/hero-floor-800.webp',
  '/photos/opening-day-1080.webp',
  '/video/showroom.mp4',
  '/vehicles/raider-125/card.webp',
  '/vehicles/raider-125/striking-red.webp',
  '/vehicles/apache-rr-310/card.webp',
  '/fonts/rupee-inter.woff2',
];

/** Text that must never appear on the live site. */
const FORBIDDEN = ['Shakti Motors', 'Vyapar Vihar', '98765 43210', 'PREVIEW', 'Sample build'];

const lines = [];
const fail = [];
const say = (s) => {
  lines.push(s);
  console.log(s.replace(/[|*]/g, ''));
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));

say(`## Live check — ${SITE}\n`);
say('| route | status | title | notes |');
say('| --- | --- | --- | --- |');

for (const route of ROUTES) {
  const url = SITE + route.path;
  let status = 0;
  let note = '';
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    status = response?.status() ?? 0;
    const body = await page.locator('body').innerText();
    if (!body.toLowerCase().includes(route.expect.toLowerCase())) {
      note = `missing "${route.expect}"`;
      fail.push(`${route.path}: ${note}`);
    }
    for (const bad of FORBIDDEN) {
      if (body.includes(bad)) {
        note += ` ${'**'}found "${bad}"${'**'}`;
        fail.push(`${route.path}: still says "${bad}"`);
      }
    }
    if (status !== 200) fail.push(`${route.path}: HTTP ${status}`);
  } catch (error) {
    note = String(error.message ?? error).slice(0, 60);
    fail.push(`${route.path}: ${note}`);
  }
  const title = (await page.title().catch(() => '')).slice(0, 44);
  say(`| \`${route.path}\` | ${status} | ${title} | ${note || 'ok'} |`);
}

say('\n### Assets\n');
say('| asset | status | bytes |');
say('| --- | --- | --- |');
for (const asset of ASSETS) {
  try {
    const response = await page.request.get(SITE + asset);
    const size = (await response.body()).byteLength;
    if (!response.ok()) fail.push(`${asset}: HTTP ${response.status()}`);
    say(`| \`${asset}\` | ${response.status()} | ${(size / 1024).toFixed(0)} KB |`);
  } catch (error) {
    fail.push(`${asset}: ${error.message}`);
    say(`| \`${asset}\` | error | ${String(error.message).slice(0, 40)} |`);
  }
}

say('\n### Behaviour on a phone\n');
await page.goto(SITE + '/vehicles/raider-125/', { waitUntil: 'networkidle', timeout: 45_000 });
await page.waitForTimeout(1500);

const swatches = page.locator('[role="radio"]');
const swatchCount = await swatches.count();
say(`- colour swatches on the Raider: **${swatchCount}**`);
if (swatchCount < 2) fail.push('Raider page has fewer than two colour swatches');

const before = await page.locator('figure img').first().getAttribute('src');
if (swatchCount > 1) {
  await swatches.nth(1).tap();
  await page.waitForTimeout(600);
  const after = await page.locator('figure img').first().getAttribute('src');
  say(`- swatch swaps the photograph: **${after !== before ? 'yes' : 'NO'}**`);
  if (after === before) fail.push('swatch did not swap the photograph on the live site');
}

// Every WhatsApp link must carry a prefilled message and the right number.
const waLinks = await page.locator('a[href*="wa.me"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
const withText = waLinks.filter((h) => h && h.includes('text='));
say(`- WhatsApp links on the model page: **${waLinks.length}**, prefilled: **${withText.length}**`);
if (waLinks.length === 0 || withText.length !== waLinks.length) {
  fail.push('a WhatsApp link is missing its prefilled message');
}
const numbers = [...new Set(waLinks.map((h) => /wa\.me\/(\d+)/.exec(h ?? '')?.[1]).filter(Boolean))];
say(`- number they open: **${numbers.join(', ') || 'none'}**`);

// The message must carry the live origin, not a stale configured one.
const sample = decodeURIComponent(waLinks[0] ?? '');
const carriesOrigin = sample.includes(SITE);
say(`- message carries this origin: **${carriesOrigin ? 'yes' : 'NO'}**`);
if (!carriesOrigin) fail.push('WhatsApp message does not carry the live origin');

await page.screenshot({ path: 'live-model-mobile.png', fullPage: false });
await page.goto(SITE + '/', { waitUntil: 'networkidle', timeout: 45_000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'live-home-mobile.png', fullPage: false });

say(`\n- console errors: **${consoleErrors.length}**`);
for (const error of consoleErrors.slice(0, 5)) say(`  - \`${error.slice(0, 120)}\``);

await browser.close();

say('\n---\n');
if (fail.length === 0) {
  say('**Everything checked passed.**');
} else {
  say(`**${fail.length} problem(s):**\n`);
  for (const f of fail) say(`- ${f}`);
}

await writeFile('live-check.md', lines.join('\n') + '\n');
if (fail.length > 0) process.exitCode = 1;
