/**
 * Stand-in render generator for the 360° spinner.
 *
 * WHY THIS EXISTS
 * The commissioned photoreal renders will not exist by the time the sample goes
 * to the client, and scraping TVS product photography is not an option. So the
 * sample ships stand-ins built to the *exact* commission specification:
 *
 *   - 36 frames per colour, orbiting at 10° intervals
 *   - camera fixed at 15° elevation, locked focal length (orthographic), locked exposure
 *   - neutral studio, dark ground matching --ink
 *   - soft key light from upper front-left, rim light separating the silhouette
 *   - one sequence per official body colour
 *   - 2000px-wide canvas, identical aspect ratio for every model
 *
 * Proportions are driven from the real vehicle dimensions in content/vehicles.ts
 * (wheelbase, overall length, height, wheel diameter), so the silhouettes are
 * true to the machines rather than generic.
 *
 * Because the dimensions, framing and file naming match the commission spec,
 * dropping the finished renders into /public/vehicles/<slug>/<colour>/ is a file
 * replacement — no code change, no layout change, nothing reflows.
 *
 * Run: npm run gen:assets
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_ROOT = join(ROOT, 'public', 'vehicles');

/* ------------------------------------------------------------------ */
/* Commission spec constants — do not drift from these.                */
/* ------------------------------------------------------------------ */

const FRAMES = 36;
const STEP_DEG = 360 / FRAMES;
const ELEVATION_DEG = 15;
const CANVAS_W = 2000;
const CANVAS_H = 1200;
const INK = '#0E0E10';

/* ------------------------------------------------------------------ */
/* Read vehicle geometry straight out of the content file.             */
/* ------------------------------------------------------------------ */

function loadVehicles() {
  const source = readFileSync(join(ROOT, 'content', 'vehicles.ts'), 'utf8');
  const out = [];

  // Top-level vehicle entries only — colour `slug:` keys sit two levels deeper.
  const slugRe = /\n {4}slug: '([^']+)'/g;
  let match;
  while ((match = slugRe.exec(source))) {
    const slug = match[1];
    const tail = source.slice(match.index, match.index + 6000);

    const render = /render:\s*\{\s*form:\s*'(\w+)',\s*lengthMm:\s*(\d+),\s*heightMm:\s*(\d+),\s*wheelbaseMm:\s*(\d+),\s*wheelDiaMm:\s*(\d+)/.exec(
      tail,
    );
    if (!render) continue;

    const colours = [];
    const coloursBlock = /colours:\s*\[([\s\S]*?)\],\n\s{4}specs:/.exec(tail);
    if (coloursBlock) {
      const colourRe = /slug:\s*'([^']+)',\s*hex:\s*'([^']+)',\s*accentHex:\s*'([^']+)'/g;
      let c;
      while ((c = colourRe.exec(coloursBlock[1]))) {
        colours.push({ slug: c[1], hex: c[2], accentHex: c[3] });
      }
    }

    out.push({
      slug,
      form: render[1],
      lengthMm: Number(render[2]),
      heightMm: Number(render[3]),
      wheelbaseMm: Number(render[4]),
      wheelDiaMm: Number(render[5]),
      colours,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Colour maths — one key light, one rim light, locked exposure.       */
/* ------------------------------------------------------------------ */

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(amount >= 1 ? [r * amount, g * amount, b * amount] : [r * amount, g * amount, b * amount]);
}

function normalise(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Key light from upper front-left; rim light from behind-right. */
const KEY = normalise([0.55, -0.45, 0.7]);
const RIM = normalise([-0.7, 0.5, 0.25]);

function litColour(baseHex, normal) {
  const key = Math.max(0, normal[0] * KEY[0] + normal[1] * KEY[1] + normal[2] * KEY[2]);
  const rim = Math.max(0, normal[0] * RIM[0] + normal[1] * RIM[1] + normal[2] * RIM[2]);
  const level = 0.4 + 0.72 * key + 0.16 * Math.pow(rim, 3);
  return shade(baseHex, level);
}

/* ------------------------------------------------------------------ */
/* Orthographic camera, yaw a + fixed elevation p.                     */
/* ------------------------------------------------------------------ */

function makeCamera(yawDeg) {
  const a = ((90 + yawDeg) * Math.PI) / 180;
  const p = (ELEVATION_DEG * Math.PI) / 180;
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const sp = Math.sin(p);
  const cp = Math.cos(p);

  return {
    /** World point -> { x, y } in canvas units and a depth for painter sorting. */
    project([X, Y, Z]) {
      const x = X * sa - Y * ca;
      const y = -(X * ca * sp + Y * sa * sp + Z * cp);
      const depth = X * ca * cp + Y * sa * cp - Z * sp;
      return { x, y, depth };
    },
    /** Positive means the surface faces away from the camera. */
    facingAway(normal) {
      const f = [ca * cp, sa * cp, -sp];
      return normal[0] * f[0] + normal[1] * f[1] + normal[2] * f[2] > 0;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/**
 * A hull is the vehicle's side profile lofted across its width.
 *
 * Each profile point is [u, v, w]: `u` runs -1 (tail) to +1 (nose) across the
 * vehicle's overall length, `v` runs 0 (ground) to 1 (overall height), and `w`
 * scales the half-width at that point. Authoring in normalised coordinates means
 * one profile adapts correctly to every model's real dimensions.
 *
 * Lofting a profile — rather than stacking boxes — is what makes the silhouette
 * read as a vehicle from every one of the 36 angles.
 */
function hull(profile, halfWidthMm, role) {
  return { kind: 'hull', profile, hw: halfWidthMm, role };
}

/** Small solid part: handlebars, fork legs, grab rails. */
function box(cx, cz, lx, lz, halfWidth, role, opts = {}) {
  return {
    kind: 'box',
    cx,
    cz,
    cy: opts.cy ?? 0,
    lx,
    lz,
    hw: halfWidth,
    role,
    taper: opts.taper ?? 1,
    skew: opts.skew ?? 0,
  };
}

/** Wheel: a disc in the XZ plane, centred on the vehicle's lateral midline. */
function wheel(cx, radius, width) {
  return { kind: 'wheel', cx, radius, width };
}

const BOX_FACES = [
  { n: [1, 0, 0], idx: [1, 3, 7, 5] },
  { n: [-1, 0, 0], idx: [0, 4, 6, 2] },
  { n: [0, 1, 0], idx: [2, 6, 7, 3] },
  { n: [0, -1, 0], idx: [0, 1, 5, 4] },
  { n: [0, 0, 1], idx: [4, 5, 7, 6] },
  { n: [0, 0, -1], idx: [0, 2, 3, 1] },
];

function boxCorners(b) {
  const x0 = b.cx - b.lx / 2;
  const x1 = b.cx + b.lx / 2;
  const z0 = b.cz - b.lz / 2;
  const z1 = b.cz + b.lz / 2;

  const pt = (xi, yi, zi) => {
    const x = xi ? x1 : x0;
    const z = zi ? z1 : z0;
    const w = b.hw * (zi ? b.taper : 1);
    return [x + (zi ? b.skew : 0), b.cy + (yi ? w : -w), z];
  };
  return [
    pt(0, 0, 0), pt(1, 0, 0), pt(0, 1, 0), pt(1, 1, 0),
    pt(0, 0, 1), pt(1, 0, 1), pt(0, 1, 1), pt(1, 1, 1),
  ];
}

/* ------------------------------------------------------------------ */
/* Side profiles — authored once per body form, scaled per model.      */
/* ------------------------------------------------------------------ */

const PROFILES = {
  scooter: {
    width: 232,
    hulls: [
      // Underbody and engine — dark mechanical mass between the wheels.
      { role: 'dark', points: [
        [0.42, 0.30, 0.62], [0.28, 0.27, 0.80], [0.05, 0.255, 0.95], [-0.20, 0.26, 0.95],
        [-0.42, 0.30, 0.80], [-0.62, 0.34, 0.70], [-0.80, 0.32, 0.62], [-0.86, 0.24, 0.60],
        [-0.60, 0.20, 0.72], [-0.20, 0.185, 0.95], [0.10, 0.185, 0.92], [0.36, 0.21, 0.66],
      ] },
      // Front apron — the tall panel that makes a scooter read as a scooter.
      { role: 'body', points: [
        [0.98, 0.28, 0.34], [1.00, 0.44, 0.56], [0.96, 0.62, 0.72], [0.88, 0.78, 0.80],
        [0.78, 0.87, 0.86], [0.62, 0.885, 0.92], [0.54, 0.80, 0.80], [0.50, 0.62, 0.76],
        [0.46, 0.44, 0.68], [0.40, 0.30, 0.60], [0.52, 0.28, 0.44], [0.70, 0.26, 0.36],
        [0.88, 0.24, 0.32],
      ] },
      // Rear body over the engine, carrying the underseat storage.
      { role: 'body', points: [
        [-0.10, 0.32, 0.90], [-0.20, 0.46, 0.94], [-0.30, 0.58, 0.92], [-0.40, 0.635, 0.90],
        [-0.62, 0.65, 0.88], [-0.84, 0.63, 0.84], [-0.94, 0.54, 0.76], [-0.98, 0.42, 0.68],
        [-0.92, 0.32, 0.72], [-0.70, 0.28, 0.84], [-0.40, 0.285, 0.90],
      ] },
      { role: 'dark', points: [
        [-0.34, 0.645, 0.88], [-0.52, 0.685, 0.92], [-0.74, 0.69, 0.90], [-0.90, 0.655, 0.84],
        [-0.89, 0.615, 0.84], [-0.72, 0.635, 0.90], [-0.50, 0.635, 0.92], [-0.35, 0.61, 0.88],
      ] },
      // Apron graphic and headlamp, in the colour's accent.
      { role: 'accent', points: [
        [0.94, 0.50, 0.60], [0.90, 0.62, 0.74], [0.80, 0.70, 0.80], [0.70, 0.64, 0.76],
        [0.76, 0.52, 0.68], [0.86, 0.44, 0.60],
      ] },
    ],
  },

  escooter: {
    width: 228,
    hulls: [
      { role: 'dark', points: [
        [0.44, 0.30, 0.60], [0.28, 0.27, 0.82], [0.05, 0.255, 0.96], [-0.22, 0.26, 0.96],
        [-0.44, 0.30, 0.82], [-0.64, 0.34, 0.72], [-0.82, 0.32, 0.62], [-0.88, 0.24, 0.60],
        [-0.62, 0.20, 0.74], [-0.20, 0.19, 0.96], [0.10, 0.19, 0.94], [0.38, 0.21, 0.64],
      ] },
      { role: 'body', points: [
        [0.98, 0.30, 0.32], [1.00, 0.50, 0.62], [0.98, 0.70, 0.78], [0.92, 0.84, 0.84],
        [0.80, 0.90, 0.90], [0.64, 0.905, 0.94], [0.57, 0.82, 0.82], [0.54, 0.64, 0.78],
        [0.49, 0.46, 0.70], [0.42, 0.31, 0.60], [0.54, 0.29, 0.44], [0.72, 0.27, 0.36],
        [0.89, 0.25, 0.30],
      ] },
      { role: 'body', points: [
        [-0.12, 0.33, 0.90], [-0.22, 0.48, 0.95], [-0.32, 0.60, 0.93], [-0.42, 0.65, 0.91],
        [-0.64, 0.665, 0.89], [-0.88, 0.65, 0.85], [-0.98, 0.55, 0.76], [-1.00, 0.43, 0.68],
        [-0.94, 0.33, 0.72], [-0.72, 0.29, 0.85], [-0.42, 0.295, 0.90],
      ] },
      { role: 'dark', points: [
        [-0.36, 0.66, 0.89], [-0.54, 0.70, 0.93], [-0.76, 0.705, 0.91], [-0.92, 0.67, 0.85],
        [-0.91, 0.63, 0.85], [-0.74, 0.65, 0.91], [-0.52, 0.65, 0.93], [-0.37, 0.625, 0.89],
      ] },
      { role: 'accent', points: [
        [0.96, 0.56, 0.60], [0.93, 0.70, 0.76], [0.83, 0.78, 0.82], [0.73, 0.72, 0.78],
        [0.79, 0.58, 0.68], [0.88, 0.50, 0.60],
      ] },
    ],
  },

  motorcycle: {
    width: 196,
    hulls: [
      // Engine, crankcase and the frame mass hanging between the wheels.
      { role: 'dark', points: [
        [0.26, 0.42, 0.62], [0.20, 0.30, 0.70], [0.02, 0.235, 0.74], [-0.20, 0.26, 0.76],
        [-0.34, 0.40, 0.84], [-0.40, 0.52, 0.72], [-0.22, 0.545, 0.66], [0.06, 0.52, 0.60],
        [0.22, 0.50, 0.56],
      ] },
      // Frame spine and downtube — thin tubes, dark, present only so the tank
      // and tail do not read as floating.
      { role: 'dark', points: [
        [0.60, 0.685, 0.20], [0.20, 0.655, 0.22], [-0.30, 0.655, 0.22], [-0.66, 0.685, 0.20],
        [-0.66, 0.635, 0.20], [-0.30, 0.615, 0.22], [0.20, 0.615, 0.22], [0.58, 0.645, 0.20],
      ] },
      { role: 'dark', points: [
        [0.60, 0.66, 0.18], [0.38, 0.50, 0.20], [0.25, 0.34, 0.20], [0.18, 0.31, 0.20],
        [0.30, 0.50, 0.20], [0.52, 0.65, 0.18],
      ] },
      { role: 'accent', points: [
        [-0.28, 0.635, 0.74], [-0.52, 0.625, 0.68], [-0.66, 0.55, 0.58], [-0.58, 0.46, 0.62],
        [-0.38, 0.46, 0.72], [-0.24, 0.53, 0.76],
      ] },
      // Fuel tank — the widest painted surface, and the shape the eye reads first.
      { role: 'body', points: [
        [0.82, 0.68, 0.40], [0.74, 0.775, 0.62], [0.56, 0.81, 1.00], [0.34, 0.79, 0.96],
        [0.18, 0.72, 0.70], [0.12, 0.62, 0.52], [0.26, 0.575, 0.62], [0.50, 0.585, 0.84],
        [0.72, 0.60, 0.54],
      ] },
      // Seat: low and dark, so the painted tank stays the brightest surface.
      { role: 'dark', points: [
        [0.16, 0.675, 0.52], [0.00, 0.70, 0.56], [-0.34, 0.705, 0.58], [-0.62, 0.715, 0.54],
        [-0.66, 0.675, 0.52], [-0.34, 0.66, 0.58], [0.00, 0.655, 0.56], [0.14, 0.64, 0.52],
      ] },
      { role: 'body', points: [
        [-0.54, 0.735, 0.58], [-0.76, 0.805, 0.50], [-0.94, 0.815, 0.36], [-1.00, 0.75, 0.28],
        [-0.92, 0.66, 0.38], [-0.72, 0.60, 0.54], [-0.54, 0.60, 0.58],
      ] },
      { role: 'accent', points: [
        [0.98, 0.62, 0.30], [0.94, 0.76, 0.44], [0.84, 0.82, 0.50], [0.74, 0.78, 0.44],
        [0.78, 0.64, 0.36], [0.88, 0.56, 0.30],
      ] },
    ],
  },

  moped: {
    width: 178,
    hulls: [
      { role: 'dark', points: [
        [0.30, 0.36, 0.40], [0.10, 0.32, 0.44], [-0.16, 0.28, 0.58], [-0.38, 0.29, 0.62],
        [-0.52, 0.38, 0.58], [-0.56, 0.50, 0.52], [-0.36, 0.50, 0.50], [-0.10, 0.44, 0.42],
        [0.20, 0.44, 0.38],
      ] },
      // Small tank over the frame tube.
      { role: 'body', points: [
        [0.54, 0.52, 0.42], [0.44, 0.565, 0.52], [0.24, 0.575, 0.58], [0.06, 0.555, 0.52],
        [0.06, 0.50, 0.48], [0.26, 0.505, 0.56], [0.46, 0.50, 0.48],
      ] },
      { role: 'dark', points: [
        [-0.02, 0.60, 0.62], [-0.30, 0.635, 0.70], [-0.58, 0.64, 0.70], [-0.76, 0.615, 0.66],
        [-0.75, 0.575, 0.66], [-0.56, 0.59, 0.70], [-0.30, 0.59, 0.70], [-0.03, 0.565, 0.62],
      ] },
      { role: 'accent', points: [
        [-0.52, 0.565, 0.64], [-0.72, 0.555, 0.60], [-0.84, 0.50, 0.54], [-0.76, 0.42, 0.56],
        [-0.58, 0.44, 0.62], [-0.48, 0.50, 0.64],
      ] },
      // Load carrier over the rear wheel — the reason people buy this vehicle.
      { role: 'metal', points: [
        [-0.72, 0.66, 0.90], [-0.98, 0.66, 0.86], [-0.98, 0.63, 0.86], [-0.72, 0.63, 0.90],
      ] },
      // Frame tube running the length of the machine.
      { role: 'dark', points: [
        [0.72, 0.495, 0.18], [0.20, 0.475, 0.20], [-0.30, 0.545, 0.20], [-0.74, 0.595, 0.18],
        [-0.74, 0.565, 0.18], [-0.30, 0.515, 0.20], [0.20, 0.445, 0.20], [0.70, 0.465, 0.18],
      ] },
      // Leg shield and headlamp nacelle.
      { role: 'body', points: [
        [0.86, 0.30, 0.30], [0.84, 0.48, 0.44], [0.78, 0.62, 0.48], [0.68, 0.60, 0.44],
        [0.70, 0.44, 0.40], [0.74, 0.30, 0.32],
      ] },
      { role: 'accent', points: [
        [0.92, 0.62, 0.30], [0.88, 0.74, 0.42], [0.78, 0.79, 0.46], [0.70, 0.74, 0.42],
        [0.74, 0.63, 0.36], [0.83, 0.57, 0.30],
      ] },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Body forms — proportions derived from the real vehicle dimensions.  */
/* ------------------------------------------------------------------ */

function buildForm(v) {
  const wb = v.wheelbaseMm;
  const r = v.wheelDiaMm / 2;
  const h = v.heightMm;
  const front = wb / 2;
  const spec = PROFILES[v.form];
  const parts = spec.hulls.map((x) => hull(x.points, spec.width, x.role));

  const isBike = v.form === 'motorcycle';

  // Fork legs, a pair either side of the front wheel.
  for (const side of [-1, 1]) {
    parts.push(
      box(front, r * 1.9, 82, r * 1.85, isBike ? 62 : 52, 'metal', {
        cy: side * (isBike ? 126 : 76),
        skew: isBike ? -46 : -26,
      }),
    );
  }

  // Handlebar and mirrors — the widest thing on the vehicle, and what makes a
  // head-on frame read correctly rather than collapsing to a sliver.
  const barZ = isBike ? h * 0.85 : h * 0.92;
  const barX = isBike ? front * 0.82 : front * 0.8;
  const barHalf = v.form === 'moped' ? 300 : 330;
  parts.push(box(barX, barZ, 76, 52, barHalf, 'dark'));

  // Mudguards, hugging each tyre.
  parts.push(box(front, r * 1.3, wb * 0.24, 74, 90, 'body', { taper: 0.9 }));
  parts.push(box(-front, r * 1.34, wb * 0.22, 70, 86, 'dark', { taper: 0.9 }));

  if (isBike) {
    // Exhaust, offset to the right of the centreline.
    parts.push(box(-wb * 0.24, r * 0.76, wb * 0.5, 90, 42, 'metal', { cy: 114 }));
  } else if (v.form !== 'moped') {
    // Grab rail behind the seat.
    parts.push(box(-wb * 0.63, h * 0.72, wb * 0.16, 48, 140, 'metal'));
  }

  const tyreWidth = isBike ? 128 : 108;
  parts.push(wheel(front, r, tyreWidth), wheel(-front, r, tyreWidth));
  return parts;
}

/* ------------------------------------------------------------------ */
/* Frame rendering                                                     */
/* ------------------------------------------------------------------ */

const ROLE_COLOURS = {
  dark: '#24262B',
  metal: '#5C616A',
};

function roleHex(role, colour) {
  if (role === 'body') return colour.hex;
  if (role === 'accent') return colour.accentHex;
  return ROLE_COLOURS[role];
}

function renderFrame(v, colour, frameIndex) {
  const cam = makeCamera(frameIndex * STEP_DEG);
  const parts = buildForm(v);

  // Locked focal length: the scale is derived from the model's overall length so
  // every frame of every colour of this model is framed identically.
  const scale = (CANVAS_W * 0.88) / v.lengthMm;
  const originX = CANVAS_W / 2;
  const originY = CANVAS_H * 0.9;

  // Integer canvas coordinates: at 2000px wide the rounding is invisible and it
  // takes roughly a fifth off every frame's file size.
  const toCanvas = (p) => ({
    x: Math.round(originX + p.x * scale),
    y: Math.round(originY + p.y * scale),
    depth: p.depth,
  });

  const polys = [];

  const halfLength = v.lengthMm / 2;

  for (const part of parts) {
    if (part.kind === 'hull') {
      const base = roleHex(part.role, colour);
      const n = part.profile.length;
      const world = part.profile.map(([u, vv, w]) => ({
        x: u * halfLength,
        z: vv * v.heightMm,
        w: w * part.hw,
      }));

      // Rim strip: one quad per profile edge, its normal taken from the edge
      // direction in the XZ plane so the lighting follows the body's curvature.
      for (let i = 0; i < n; i += 1) {
        const a = world[i];
        const b = world[(i + 1) % n];
        const edgeNormal = normalise([b.z - a.z, 0, -(b.x - a.x)]);
        const quad = [
          [a.x, -a.w, a.z],
          [b.x, -b.w, b.z],
          [b.x, b.w, b.z],
          [a.x, a.w, a.z],
        ].map((p) => toCanvas(cam.project(p)));
        polys.push({
          depth: quad.reduce((s, p) => s + p.depth, 0) / 4,
          fill: litColour(base, edgeNormal),
          pts: quad,
        });
      }

      // The two flanks. Only the camera-facing one is drawn.
      for (const side of [-1, 1]) {
        const faceNormal = [0, side, 0];
        if (cam.facingAway(faceNormal)) continue;
        const pts = world.map((p) => toCanvas(cam.project([p.x, side * p.w, p.z])));
        polys.push({
          depth: pts.reduce((s, p) => s + p.depth, 0) / pts.length - 8,
          fill: litColour(base, faceNormal),
          pts,
        });
      }
    } else if (part.kind === 'box') {
      const corners = boxCorners(part).map((c) => toCanvas(cam.project(c)));
      const base = roleHex(part.role, colour);
      for (const face of BOX_FACES) {
        if (cam.facingAway(face.n)) continue;
        const pts = face.idx.map((i) => corners[i]);
        const depth = pts.reduce((s, p) => s + p.depth, 0) / pts.length;
        polys.push({ depth, fill: litColour(base, face.n), pts });
      }
    } else {
      const SEGMENTS = 14;
      const rimBase = '#3A3F47';
      const tyreBase = '#15171B';
      const hubBase = '#585D66';

      // Tread band: quads swept between the two sidewalls, near half only.
      for (let i = 0; i < SEGMENTS; i += 1) {
        const t0 = (i / SEGMENTS) * Math.PI * 2;
        const t1 = ((i + 1) / SEGMENTS) * Math.PI * 2;
        const n = [Math.cos((t0 + t1) / 2), 0, Math.sin((t0 + t1) / 2)];
        const quad = [
          [part.cx + part.radius * Math.cos(t0), -part.width / 2, part.radius * Math.sin(t0)],
          [part.cx + part.radius * Math.cos(t1), -part.width / 2, part.radius * Math.sin(t1)],
          [part.cx + part.radius * Math.cos(t1), part.width / 2, part.radius * Math.sin(t1)],
          [part.cx + part.radius * Math.cos(t0), part.width / 2, part.radius * Math.sin(t0)],
        ].map((p) => toCanvas(cam.project(p)));
        const depth = quad.reduce((s, p) => s + p.depth, 0) / 4;
        polys.push({ depth, fill: litColour(tyreBase, n), pts: quad });
      }

      // Sidewall + rim disc on the camera-facing side.
      for (const side of [-1, 1]) {
        const n = [0, side, 0];
        if (cam.facingAway(n)) continue;
        const disc = (radiusScale) => {
          const pts = [];
          for (let i = 0; i < SEGMENTS * 2; i += 1) {
            const t = (i / (SEGMENTS * 2)) * Math.PI * 2;
            pts.push(
              toCanvas(
                cam.project([
                  part.cx + part.radius * radiusScale * Math.cos(t),
                  (side * part.width) / 2,
                  part.radius * radiusScale * Math.sin(t),
                ]),
              ),
            );
          }
          return pts;
        };

        const ring = disc(1);
        const depth = ring.reduce((s, p) => s + p.depth, 0) / ring.length;
        polys.push({ depth: depth + 2, fill: litColour(tyreBase, n), pts: ring });
        polys.push({ depth: depth + 1, fill: litColour(rimBase, n), pts: disc(0.66) });
        polys.push({ depth, fill: litColour(hubBase, n), pts: disc(0.24) });
      }
    }
  }

  polys.sort((a, b) => b.depth - a.depth);

  const shadowRx = Math.round(v.lengthMm * scale * 0.42);
  const body = polys
    .map((p) => `<polygon points="${p.pts.map((q) => `${q.x},${q.y}`).join(' ')}" fill="${p.fill}"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}" role="img"><defs><radialGradient id="g" cx="50%" cy="72%" r="62%"><stop offset="0" stop-color="#1C1C21"/><stop offset="1" stop-color="${INK}"/></radialGradient><radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#g)"/><ellipse cx="${originX}" cy="${Math.round(originY + 12)}" rx="${shadowRx}" ry="${Math.round(shadowRx * 0.11)}" fill="url(#s)"/>${body}</svg>`;
}

/* ------------------------------------------------------------------ */

async function main() {
  const vehiclesList = loadVehicles();
  if (vehiclesList.length === 0) throw new Error('No vehicles parsed from content/vehicles.ts');

  await rm(OUT_ROOT, { recursive: true, force: true });

  let files = 0;
  let bytes = 0;
  let largest = 0;

  for (const v of vehiclesList) {
    for (const colour of v.colours) {
      const dir = join(OUT_ROOT, v.slug, colour.slug);
      await mkdir(dir, { recursive: true });
      for (let f = 0; f < FRAMES; f += 1) {
        const svg = renderFrame(v, colour, f);
        await writeFile(join(dir, `frame-${String(f).padStart(2, '0')}.svg`), svg, 'utf8');
        files += 1;
        bytes += svg.length;
        largest = Math.max(largest, svg.length);
      }
    }
    console.log(
      `  ${v.slug.padEnd(16)} ${v.colours.length} colours × ${FRAMES} frames  (${v.form})`,
    );
  }

  console.log(
    `\n${files} frames written — ${(bytes / 1024 / 1024).toFixed(2)} MB total, ` +
      `largest frame ${(largest / 1024).toFixed(1)} KB (spec limit: 40 KB).`,
  );
  if (largest > 40 * 1024) throw new Error('A frame exceeded the 40KB commission limit.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
