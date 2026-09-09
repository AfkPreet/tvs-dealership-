/**
 * Cross-device audit harness.
 *
 * Serves the static export and drives it in Chromium at the four breakpoints in
 * the brief, plus an iPhone profile and a JavaScript-disabled pass. Writes
 * screenshots and prints anything that fails a hard requirement.
 *
 * Run: node scripts/audit.mjs [outDir]
 */

import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
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
const SHOTS = process.argv[2] ?? join(ROOT, '.audit');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
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
    });
    res.end(body);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

const problems = [];
const note = (message) => problems.push(message);

const BREAKPOINTS = [
  { name: '360', width: 360, height: 780 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1600', width: 1600, height: 1000 },
];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'vehicles', path: '/vehicles/' },
  { name: 'model', path: '/vehicles/jupiter-125/' },
  { name: 'finance', path: '/finance/' },
  { name: 'service', path: '/service/' },
  { name: 'about', path: '/about/' },
];

async function main() {
  await mkdir(SHOTS, { recursive: true });
  const port = 8123;
  const server = await serve(port);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  /* --- 1. Every breakpoint, every page, plus horizontal-overflow check --- */
  for (const bp of BREAKPOINTS) {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      deviceScaleFactor: 1,
    });
    // Mark the opening card as already seen, so these screenshots show the page
    // rather than the card mid-fade over it. Section 5c tests the card itself.
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem('skm-intro-shown', '1');
      } catch {
        /* storage disabled; the card is harmless in a screenshot */
      }
    });

    const page = await context.newPage();
    page.on('pageerror', (error) => note(`[${bp.name}] page error: ${error.message}`));

    for (const target of PAGES) {
      await page.goto(base + target.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) note(`[${bp.name}] ${target.path} scrolls horizontally by ${overflow}px`);

      await page.screenshot({ path: join(SHOTS, `${target.name}-${bp.name}.png`), fullPage: false });
    }

    await context.close();
  }

  /* --- 2. Tap targets and input font sizes on the phone floor --- */
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
    const page = await context.newPage();
    for (const target of PAGES) {
      await page.goto(base + target.path, { waitUntil: 'networkidle' });

      const small = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('a, button, input, select, [role="button"]')) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          if (el.closest('[hidden]')) continue;

          // Visually hidden controls (skip link, sr-only radios) are reached via
          // their visible label or on focus, not by tapping the element itself.
          if (el.classList.contains('sr-only')) continue;

          // A control wrapped in a label that is itself a large target — the
          // label is what the thumb lands on.
          const label = el.closest('label');
          if (label && label.getBoundingClientRect().height >= 44) continue;

          // Cards use a full-bleed ::after overlay on the title link, so the
          // whole card is the hit area rather than the text box.
          if (el.dataset.cardLink !== undefined) continue;

          // WCAG 2.5.8 exempts links flowing inline inside a block of text.
          if (getComputedStyle(el).display === 'inline') continue;

          if (rect.height < 44 || rect.width < 24) {
            out.push(`${el.tagName.toLowerCase()}.${el.className || '-'} ${Math.round(rect.width)}×${Math.round(rect.height)}`);
          }
        }
        return out.slice(0, 6);
      });
      for (const entry of small) note(`[360] ${target.path} small tap target: ${entry}`);

      const tiny = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input, select, textarea'))
          .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
          .map((el) => `${el.tagName.toLowerCase()}#${el.id}`),
      );
      for (const entry of tiny) note(`[360] ${target.path} input under 16px (iOS will zoom): ${entry}`);
    }
    await context.close();
  }

  /* --- 3. The hero must work with JavaScript disabled --- */
  {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });

    const heading = page.locator('h1');
    if (!(await heading.isVisible())) note('[no-js] hero headline is not visible');
    const cta = page.getByRole('link', { name: /test ride/i }).first();
    if (!(await cta.isVisible())) note('[no-js] hero primary CTA is not visible');
    const opacity = await heading.evaluate((el) => getComputedStyle(el).opacity);
    if (Number(opacity) < 0.99) note(`[no-js] hero headline opacity is ${opacity}`);

    await page.screenshot({ path: join(SHOTS, 'home-nojs.png') });
    await context.close();
  }

  /* --- 4. prefers-reduced-motion must disable both showpieces --- */
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#hero svg g')).filter(
        (g) => Number(getComputedStyle(g).opacity) < 0.99,
      ).length,
    );
    if (hidden > 0) note(`[reduced-motion] ${hidden} hero layers are still partly transparent`);

    await page.goto(base + '/vehicles/jupiter-125/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(SHOTS, 'model-reduced.png') });
    await context.close();
  }

  /* --- 5. The colour stage: swatches swap the photograph, arrows move between them --- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/vehicles/raider-125/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const group = page.locator('[role="radiogroup"]').first();
    const swatches = group.locator('[role="radio"]');
    const count = await swatches.count();
    if (count < 2) note('[colour] fewer than two swatches on the Raider page');

    // A model with no photographs yet renders the typeset plate instead, so
    // there is no image to compare. That is a valid state, not a failure, and
    // the swatch behaviour below is checked either way.
    const stageImage = page.locator('figure img');
    const hasPhoto = (await stageImage.count()) > 0;
    const before = hasPhoto ? await stageImage.first().getAttribute('src') : null;

    if (count >= 2) {
      await swatches.nth(1).click();
      await page.waitForTimeout(400);
      const checked = await swatches.nth(1).getAttribute('aria-checked');
      if (checked !== 'true') note('[colour] clicking a swatch did not check it');

      if (hasPhoto) {
        const after = await page.locator('figure img').first().getAttribute('src');
        const colourPhotos = await page.evaluate(
          () => document.querySelectorAll('[data-photo-placeholder]').length === 0,
        );
        if (colourPhotos && after === before) {
          note('[colour] swatch click did not change the photograph');
        }
      }

      // Arrow keys move the selection, which is the whole point of a radiogroup.
      await swatches.nth(1).focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      const moved = await swatches.nth(2 % count).getAttribute('aria-checked');
      if (moved !== 'true') note('[colour] arrow key did not move the selection');
    }

    await page.screenshot({ path: join(SHOTS, 'model-colour-stage.png') });
    await context.close();
  }

  /* --- 5b. The model page on a real iPhone profile --- */
  {
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    await page.goto(base + '/vehicles/raider-125/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const swatches = page.locator('[role="radio"]');
    if ((await swatches.count()) > 1) {
      await swatches.nth(1).tap();
      await page.waitForTimeout(400);
      if ((await swatches.nth(1).getAttribute('aria-checked')) !== 'true') {
        note('[colour] tapping a swatch on a phone did not select it');
      }
    }
    await page.screenshot({ path: join(SHOTS, 'model-iphone.png') });
    await context.close();
  }

  /* --- 5c. The intro card gets out of the way, and never blocks the page --- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });

    // It must be gone within a second and a half, without any interaction.
    await page.waitForTimeout(1600);
    if ((await page.locator('[data-intro]').count()) > 0) {
      note('[intro] the opening card was still on screen after 1.6s');
    }

    // The headline underneath must have been readable the whole time.
    const headline = page.locator('h1').first();
    if (!(await headline.isVisible())) note('[intro] the hero headline is not visible after the intro');

    // Second visit in the same session must not show it again.
    await page.goto(base + '/vehicles/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    if ((await page.locator('[data-intro]').count()) > 0) {
      note('[intro] the opening card played again on the second page of a session');
    }
    await context.close();
  }

  /* --- 5d. The whole-range rail scrolls and every card links somewhere --- */
  {
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });

    const rail = page.locator('.model-rail');
    if ((await rail.count()) === 0) {
      note('[range] the model rail is missing from the home page');
    } else {
      const overflows = await rail.first().evaluate((el) => el.scrollWidth > el.clientWidth + 8);
      if (!overflows) note('[range] the model rail does not scroll on a phone');

      const links = rail.first().locator('a[href^="/vehicles/"]');
      if ((await links.count()) < 10) note('[range] the model rail is missing models');
    }
    await context.close();
  }

  /* --- 5e. The rail scrolls on a laptop too, and its arrows work --- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const rail = page.locator('.model-rail').first();
    if ((await rail.count()) === 0) {
      note('[range] the model rail is missing on a laptop');
    } else {
      const overflows = await rail.evaluate((el) => el.scrollWidth > el.clientWidth + 8);
      if (!overflows) note('[range] the model rail does not scroll on a laptop');

      const before = await rail.evaluate((el) => el.scrollLeft);
      // The forward arrow is the second of the two.
      await page.locator('button:has-text("→")').first().click();
      await page.waitForTimeout(700);
      const after = await rail.evaluate((el) => el.scrollLeft);
      if (after <= before) note('[range] the rail arrow did not move it');
    }
    await context.close();
  }

  /* --- 6. The EMI calculator updates live and matches the formula --- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/finance/', { waitUntil: 'networkidle' });

    await page.locator('input[type="range"]').first().fill('100000');
    await page.locator('input[type="range"]').nth(1).fill('0');
    await page.getByRole('radio', { name: '36', exact: true }).check().catch(async () => {
      await page.locator('input[name="tenure"][value="36"]').check({ force: true });
    });
    await page.locator('input[type="range"]').nth(2).fill('9.7');
    await page.waitForTimeout(900);

    const shown = await page.locator('[data-testid="emi-output"]').first().innerText();
    const digits = Number(shown.replace(/[^\d]/g, ''));
    if (Math.abs(digits - 3213) > 2) note(`[emi] page shows ${shown} for the ₹1,00,000 / 36 / 9.7% case (expected ₹3,213)`);
    await page.screenshot({ path: join(SHOTS, 'finance-1440.png') });
    await context.close();
  }

  /* --- 7. Every CTA produces a correctly prefilled WhatsApp message --- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    for (const target of PAGES) {
      await page.goto(base + target.path, { waitUntil: 'networkidle' });
      const links = await page.locator('a[href*="wa.me"]').evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('href')),
      );
      if (links.length === 0) note(`[whatsapp] ${target.path} has no WhatsApp link`);
      for (const href of links) {
        const url = new URL(href);
        const text = url.searchParams.get('text');
        if (!text) note(`[whatsapp] ${target.path} link has no prefilled text: ${href}`);
        else if (!text.includes('http')) note(`[whatsapp] ${target.path} message omits the source page`);
      }
    }

    // At least one CTA on a model page must name that model in the message.
    await page.goto(base + '/vehicles/ntorq-125/', { waitUntil: 'networkidle' });
    const modelLinks = await page.locator('a[href*="wa.me"]').evaluateAll((nodes) =>
      nodes.map((n) => decodeURIComponent(n.getAttribute('href'))),
    );
    if (!modelLinks.some((href) => href.includes('NTORQ 125'))) {
      note('[whatsapp] no CTA on the model page names the model');
    }
    await context.close();
  }

  /* --- 8. Language toggle persists across navigation and a reload --- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    // Found by data attribute, not by label: the Hindi button reads "HI" on an
    // English page and "हिं" once Hindi is on, because setting a Devanagari
    // glyph in English pulls a 121KB font for one character.
    await page.locator('button[data-locale="hi"]').first().click();
    await page.waitForTimeout(200);

    const lang = await page.evaluate(() => document.documentElement.lang);
    if (lang !== 'hi-IN') note(`[i18n] html lang is "${lang}" after switching to Hindi`);

    await page.getByRole('link', { name: 'गाड़ियाँ' }).first().click();
    await page.waitForTimeout(500);
    if (!(await page.locator('h1').first().innerText()).includes('TVS')) {
      note('[i18n] Hindi vehicles page heading did not render');
    }

    await page.goto(base + '/finance/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const stored = await page.evaluate(() => localStorage.getItem('shakti.locale'));
    if (stored !== 'hi') note(`[i18n] stored locale is "${stored}" after a reload`);
    await page.screenshot({ path: join(SHOTS, 'finance-hindi.png') });
    await context.close();
  }

  /* --- 9. Filter state survives a share-and-open round trip --- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '/vehicles/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Scooters/ }).click();
    await page.waitForTimeout(200);
    const url = page.url();
    if (!url.includes('type=scooter')) note(`[filter] URL did not record the filter: ${url}`);

    // The count comes from the chip's own label rather than a number written
    // here, so adding a model to the range does not fail the audit.
    const label = await page.getByRole('button', { name: /Scooters/ }).innerText();
    const expected = Number(/(\d+)/.exec(label)?.[1] ?? '0');

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const cards = await page.locator('ul li article').count();
    if (expected === 0) {
      note('[filter] the Scooters chip does not show a count');
    } else if (cards !== expected) {
      note(`[filter] shared URL rendered ${cards} scooters, the chip says ${expected}`);
    }
    await context.close();
  }

  await browser.close();
  server.close();

  if (problems.length === 0) {
    console.log('All audit checks passed.');
  } else {
    console.log(`${problems.length} issue(s):`);
    for (const problem of problems) console.log(`  - ${problem}`);
  }
  console.log(`Screenshots in ${SHOTS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
