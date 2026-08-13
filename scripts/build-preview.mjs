/**
 * Bundles the static export into ONE self-contained HTML file that can be opened
 * anywhere — including on a phone — with no server and no network.
 *
 * WHAT THIS IS
 * A faithful *visual* preview. It carries the real exported markup, the real
 * stylesheet, the real self-hosted fonts and the real vehicle artwork, in both
 * languages, with working navigation between all five routes. Because the site
 * is built so that its static state is the finished page, this shows the design
 * exactly as it renders — nothing here is a mockup or a redrawing.
 *
 * WHAT IT IS NOT
 * It does not run the app. Next's App Router does not hydrate inside a `srcdoc`
 * or `blob:` document — the RSC stream errors out — so rather than ship a page
 * that half-works, the JavaScript is stripped entirely and the inert controls
 * are labelled as such. Anything that needs the app running (the EMI sliders,
 * the 360° drag, the category filters, form submission) has to be tested on the
 * deployed site or a local `npm run dev`.
 *
 * Both language builds are included, so the Hindi copy is checkable on a phone.
 *
 * Run: npm run preview
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGET = join(ROOT, '.audit', 'preview.html');

const BUILDS = [
  { locale: 'en', dir: join(ROOT, 'out') },
  { locale: 'hi', dir: join(ROOT, 'out-hi') },
];

/**
 * The spinner cannot rotate without the app running, so the bundle carries one
 * frame per colour — the three-quarter hero angle — rather than all 36. That is
 * the difference between a 2MB file and a 13MB one.
 */
const HERO_FRAME = 3;
const HERO_TAG = `frame-${String(HERO_FRAME).padStart(2, '0')}`;

const MIME = { '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' };

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const dataUri = (buffer, ext) =>
  `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buffer.toString('base64')}`;

/**
 * Escape every non-ASCII character to a \uXXXX sequence. The bundle carries a
 * whole Hindi build, and if the shell is ever served or saved without a UTF-8
 * declaration that copy turns to mojibake. Pure-ASCII output cannot be misread.
 */
const ascii = (text) =>
  text.replace(/[\u0080-\uFFFF]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

/**
 * Injected into every page. The bundle ships no application JavaScript, so this
 * is the only script in the document: it paints the inlined artwork and hands
 * internal links to the shell, which loads that route's document.
 */
const SHIM = `
<script>
(function () {
  var FRAMES = window.__PREVIEW_FRAMES__ || {};

  document.querySelectorAll('img[data-frame]').forEach(function (img) {
    var key = img.getAttribute('data-frame').replace(/frame-\\d+/, '${HERO_TAG}');
    if (FRAMES[key]) img.src = FRAMES[key];
  });

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) !== '/' || link.target === '_blank') return;
    event.preventDefault();
    parent.postMessage({ type: 'preview:navigate', href: href }, '*');
  }, true);
})();
<\/script>`;

async function collect(dir) {
  const pages = new Map();
  const assets = new Map();
  const frames = new Map();

  for await (const file of walk(dir)) {
    const url = `/${relative(dir, file).split('\\').join('/')}`;
    const ext = extname(file);

    if (ext === '.html') {
      if (url.startsWith('/404')) continue;
      pages.set(url.replace(/index\.html$/, '').replace(/\.html$/, '/'), await readFile(file, 'utf8'));
      continue;
    }
    if (ext === '.txt') continue;

    if (url.startsWith('/vehicles/') && ext === '.svg') {
      if (Number(/frame-(\d+)\.svg$/.exec(url)?.[1]) !== HERO_FRAME) continue;
      frames.set(url, await readFile(file));
      continue;
    }
    assets.set(url, { buffer: await readFile(file), ext });
  }

  return { pages, assets, frames };
}

const CSS_SLOT = '<!--PREVIEW_CSS-->';

function flatten(html, { iconUri }) {
  let next = html;

  // A placeholder for the stylesheet, filled in when the shell assembles the
  // page. The CSS carries the embedded fonts and is over half a megabyte, so
  // storing it per page would multiply it by twenty-six.
  next = next.replace(/<link rel="stylesheet" href="[^"]+"[^>]*\/?>/g, CSS_SLOT);
  next = next.replace(/<link rel="preload"[^>]*>/g, '');

  // No application JavaScript, and therefore no use for the RSC payload it
  // would have consumed.
  next = next.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

  if (iconUri) next = next.replace(/href="\/icon\.svg[^"]*"/g, `href="${iconUri}"`);

  // Vehicle artwork is looked up by the shim rather than inlined per page, so
  // the image bytes exist once in the bundle.
  next = next.replace(/src="(\/vehicles\/[^"]+\.svg)"/g, (whole, url) => `src="" data-frame="${url}"`);

  return next.replace('</body>', `${SHIM}</body>`);
}

async function main() {
  for (const build of BUILDS) {
    if (!existsSync(build.dir)) {
      throw new Error(
        `Missing ${relative(ROOT, build.dir)} — run \`npm run preview\`, which builds both languages.`,
      );
    }
  }

  const locales = {};
  const frames = {};
  let css = '';
  let iconUri = null;

  for (const build of BUILDS) {
    const { pages, assets, frames: buildFrames } = await collect(build.dir);

    if (!css) {
      // The stylesheet and the artwork are identical across both builds, so they
      // are stored once, with the fonts embedded into the CSS.
      for (const [, asset] of assets) {
        if (asset.ext !== '.css') continue;
        css += asset.buffer.toString('utf8').replace(/url\((\/_next\/static\/media\/[^)]+)\)/g, (whole, href) => {
          const font = assets.get(href.replace(/["']/g, ''));
          return font ? `url(${dataUri(font.buffer, font.ext)})` : whole;
        });
      }
      if (assets.has('/icon.svg')) iconUri = dataUri(assets.get('/icon.svg').buffer, '.svg');
      for (const [url, buffer] of buildFrames) frames[url] = dataUri(buffer, '.svg');
    }

    locales[build.locale] = Object.fromEntries(
      [...pages].map(([route, html]) => [route, flatten(html, { iconUri })]),
    );
  }

  const routes = Object.keys(locales.en);
  const nav = ['/', '/vehicles/', '/vehicles/jupiter-125/', '/finance/', '/service/'].filter((route) =>
    routes.includes(route),
  );
  const labels = {
    en: {
      '/': 'Home',
      '/vehicles/': 'Vehicles',
      '/vehicles/jupiter-125/': 'Model',
      '/finance/': 'Finance',
      '/service/': 'Service',
    },
    hi: {
      '/': 'होम',
      '/vehicles/': 'गाड़ियाँ',
      '/vehicles/jupiter-125/': 'मॉडल',
      '/finance/': 'Finance',
      '/service/': 'Service',
    },
  };

  const bundle = { locales, frames, nav, labels, css };

  // The whole shell is written in ASCII with HTML entities for anything above
  // it, so the page cannot be misread whatever charset it is served under.
  const shell = `<title>Shakti Motors Preview</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; height: 100%; background: #0E0E10; }
  body { display: flex; flex-direction: column; font-family: system-ui, -apple-system, sans-serif; }
  #bar {
    display: flex; gap: 6px; align-items: center; padding: 6px 10px;
    background: #1C1C21; border-bottom: 1px solid rgba(255,255,255,.12);
    color: #A9ADB6; font-size: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  #bar > * { flex: none; }
  .tag { color: #fff; background: #D2172A; border-radius: 3px; padding: 4px 7px; font-size: 10px; font-weight: 700; letter-spacing: .12em; }
  button {
    font: inherit; color: #A9ADB6; background: transparent; cursor: pointer;
    border: 1px solid rgba(255,255,255,.18); border-radius: 3px; padding: 7px 10px; min-height: 34px;
  }
  button[aria-current="true"] { background: #fff; color: #0E0E10; border-color: #fff; }
  button:focus-visible { outline: 3px solid #EC1B2E; outline-offset: 2px; }
  .sep { width: 1px; height: 22px; background: rgba(255,255,255,.18); margin: 0 4px; }
  #note { display: none; }
  @media (min-width: 1100px) { #note { display: block; margin-left: auto; padding-left: 16px; opacity: .75; } }
  iframe { flex: 1; width: 100%; border: 0; background: #0E0E10; }
</style>
<div id="bar">
  <span class="tag">PREVIEW</span>
  <span id="tabs" style="display:contents"></span>
  <span class="sep"></span>
  <span id="langs" style="display:contents"></span>
  <span id="note">Static preview &#8212; design and copy are the real build; sliders, filters and the 360&#176; drag need the deployed site.</span>
</div>
<iframe id="stage" title="Shakti Motors preview"></iframe>
<script id="bundle" type="application/json">${ascii(JSON.stringify(bundle).replace(/</g, '\\u003c'))}</script>
<script>
(function () {
  var B = JSON.parse(document.getElementById('bundle').textContent);
  var stage = document.getElementById('stage');
  var tabs = document.getElementById('tabs');
  var langs = document.getElementById('langs');
  var route = '/';
  var locale = 'en';

  function assemble() {
    var html = B.locales[locale][route] || B.locales[locale]['/'];
    html = html.replace('\\u003c!--PREVIEW_CSS-->', '\\u003cstyle>' + B.css + '\\u003c/style>');
    var preamble = '\\u003cscript>window.__PREVIEW_FRAMES__=' + JSON.stringify(B.frames) + ';\\u003c/script>';
    return html.replace('\\u003c/head>', preamble + '\\u003c/head>');
  }

  function show(next) {
    var path = next.split('#')[0].split('?')[0];
    if (path.charAt(path.length - 1) !== '/') path += '/';
    route = B.locales[locale][path] ? path : '/';
    stage.srcdoc = assemble();
    paint();
  }

  function paint() {
    tabs.innerHTML = '';
    B.nav.forEach(function (path) {
      var button = document.createElement('button');
      button.textContent = B.labels[locale][path] || path;
      if (path === route) button.setAttribute('aria-current', 'true');
      button.onclick = function () { show(path); };
      tabs.appendChild(button);
    });

    langs.innerHTML = '';
    [['en', 'EN'], ['hi', '\\u0939\\u093f\\u0902']].forEach(function (pair) {
      var button = document.createElement('button');
      button.textContent = pair[1];
      if (pair[0] === locale) button.setAttribute('aria-current', 'true');
      button.onclick = function () { locale = pair[0]; show(route); };
      langs.appendChild(button);
    });
  }

  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'preview:navigate') show(event.data.href);
  });

  show('/');
})();
</script>`;

  await writeFile(TARGET, shell, 'utf8');
  const size = (await stat(TARGET)).size;
  console.log(
    `Preview bundle: ${TARGET}\n` +
      `  ${routes.length} routes × 2 languages, ${Object.keys(frames).length} images, ` +
      `${(size / 1024 / 1024).toFixed(2)} MB`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
