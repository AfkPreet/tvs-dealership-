/**
 * The TVS range this dealership sells.
 *
 * SOURCING — every price and specification below is INDICATIVE and carries the
 * source and the date it was read. Manufacturer prices change without notice;
 * the dealership confirms against the current TVS dealer price circular before
 * quoting. The `sources` array on each model is rendered on its page, so a
 * customer can see where a number came from.
 *
 * PRICES — national ex-showroom figures, cross-checked across tvsmotor.com and
 * the mainstream auto portals. They are placeholders for the dealership's own
 * Bilaspur price list: when that arrives, the `variants` arrays are the only
 * thing that changes and every on-road total recomputes from the same formula.
 *
 * IMAGES — official TVS photography, collected by scripts/fetch-tvs.mjs with the
 * dealership's stated permission. Paths resolve from this file only. A model or
 * colour without a photo yet renders a typeset placeholder rather than a broken
 * image, so the site is never mid-build.
 *
 * OMITTED — Scooty Pep+ (TVS ended production in late 2024).
 */

import vehicleImages from './vehicle-images.json';

/** The shape scripts/prepare-vehicle-images.mjs writes for each model. */
type ModelImages = {
  /** A large studio shot, where a second pass found one. */
  hero: string | null;
  /** The navigation's 372px thumbnail. Every model has one. */
  card: string | null;
  colours: Record<string, string>;
  gallery: string[];
  sizes: Record<string, { width: number; height: number }>;
  /** Rendition widths available for each image, widest first. */
  widths: Record<string, number[]>;
};

export type VehicleCategory = 'scooter' | 'motorcycle' | 'moped' | 'electric';

export type BrakeType = 'disc' | 'drum';
export type BrakeSystem = 'abs' | 'cbs' | 'none';
export type FrontSuspension = 'telescopic' | 'usd';
export type RearSuspension = 'monoshock' | 'gasCharged' | 'twinShock' | 'coilSpring';
export type Transmission = 'cvt' | 'gear5' | 'gear6' | 'gear4' | 'automatic';
export type Cooling = 'air' | 'airOil' | 'liquid' | 'none';

export type Variant = {
  name: string;
  /** Indicative ex-showroom price in ₹. */
  exShowroom: number;
  note?: { en: string; hi: string };
};

export type ColourOption = {
  /** Official TVS colour name — kept in Latin script in both locales. */
  name: string;
  slug: string;
  /** Body hex, used for the swatch and as the placeholder ground. */
  hex: string;
  /** Secondary/graphics hex, shown as the second half of the swatch. */
  accentHex: string;
  /** Official studio photo for this colour, if one has been collected. */
  image?: string;
};

export type Specs = {
  displacementCc?: number;
  batteryKwh?: number;
  power: string;
  torque: string;
  cooling: Cooling;
  transmission: Transmission;
  /** Claimed/ARAI mileage, petrol models only. */
  mileageKmpl?: number;
  /** Claimed range, electric models only. */
  rangeKm?: number;
  kerbWeightKg: number;
  fuelTankL?: number;
  chargeTimeHrs?: number;
  seatHeightMm: number;
  wheelbaseMm: number;
  groundClearanceMm: number;
  brakes: { front: BrakeType; rear: BrakeType; system: BrakeSystem };
  suspension: { front: FrontSuspension; rear: RearSuspension };
};

export type OnRoadBreakdown = {
  exShowroom: number;
  rto: number;
  insurance: number;
  accessories: number;
  total: number;
};

export type Vehicle = {
  slug: string;
  name: string;
  category: VehicleCategory;
  /** Commuter relevance for Bilaspur — drives ordering. Lower is more prominent. */
  rank: number;
  featured: boolean;
  tagline: { en: string; hi: string };
  blurb: { en: string; hi: string };
  variants: Variant[];
  colours: ColourOption[];
  specs: Specs;
  onRoad: OnRoadBreakdown;
  images: { hero?: string; gallery: string[] };
  sources: { label: string; url: string; readOn: string }[];
};

/* ------------------------------------------------------------------ */
/* On-road maths — one formula, applied identically to every model.    */
/* ------------------------------------------------------------------ */

/**
 * Chhattisgarh two-wheeler lifetime road tax is levied at 4% of vehicle cost
 * (godigit.com/road-tax/chhattisgarh-road-tax, read 2026-08-13), plus
 * registration, HSRP number plate and smart card fees. Hypothecation (₹1,500)
 * is NOT included: it applies only to financed purchases, and is shown on the
 * finance page instead.
 */
const ROAD_TAX_RATE = 0.04;
const FIXED_RTO_FEES = 1_100; // HSRP + smart card + registration processing

function onRoad(exShowroom: number, insurance: number, accessories: number): OnRoadBreakdown {
  const rto = Math.round(exShowroom * ROAD_TAX_RATE) + FIXED_RTO_FEES;
  return { exShowroom, rto, insurance, accessories, total: exShowroom + rto + insurance + accessories };
}

const READ_ON = '2026-09-09';
const src = (label: string, url: string) => ({ label, url, readOn: READ_ON });
const tvs = (path: string) => src('tvsmotor.com — official model page', `https://www.tvsmotor.com${path}`);

/** Colour helper: keeps the 19 entries below readable. */
const c = (name: string, slug: string, hex: string, accentHex: string): ColourOption => ({
  name,
  slug,
  hex,
  accentHex,
  image: undefined,
});

const INK = '#1B1C20';
const SILVER = '#C9CCD2';
const WHITE = '#E7E9ED';
const GREY = '#5A5D63';
const RED = '#B4192A';

/* ------------------------------------------------------------------ */

export const vehicles: Vehicle[] = [
  {
    slug: 'jupiter-110',
    name: 'TVS Jupiter',
    category: 'scooter',
    rank: 1,
    featured: true,
    tagline: {
      en: 'The everyday scooter Bilaspur actually buys',
      hi: 'रोज़ चलाने वाला स्कूटर, जो बिलासपुर सच में खरीदता है',
    },
    blurb: {
      en: 'Biggest-in-class seat, 33-litre underseat storage and a fuel-injected 113cc motor. The one to put a first-time rider on.',
      hi: 'सेगमेंट की सबसे बड़ी सीट, 33 लीटर अंडरसीट स्टोरेज और fuel-injected 113cc इंजन। पहली गाड़ी लेने वालों के लिए यही।',
    },
    variants: [
      { name: 'Drum', exShowroom: 73_975 },
      { name: 'Drum Alloy', exShowroom: 78_435 },
      { name: 'SmartXonnect Drum', exShowroom: 82_130 },
      { name: 'SmartXonnect Disc', exShowroom: 85_540 },
    ],
    colours: [
      c('Meteor Red Gloss', 'meteor-red', RED, WHITE),
      c('Titanium Grey Matte', 'titanium-grey', GREY, '#B8BCC4'),
      c('Lunar White Gloss', 'lunar-white', WHITE, '#9AA0A8'),
      c('Dawn Blue Matte', 'dawn-blue', '#41597E', '#C9D2E4'),
      c('Starlight Blue Gloss', 'starlight-blue', '#2B4B8C', '#C9D2E4'),
    ],
    specs: {
      displacementCc: 113.3,
      power: '5.9 kW (8.0 PS) @ 6500 rpm',
      torque: '9.8 Nm @ 5000 rpm',
      cooling: 'air',
      transmission: 'cvt',
      mileageKmpl: 53,
      kerbWeightKg: 105,
      fuelTankL: 5.1,
      seatHeightMm: 765,
      wheelbaseMm: 1275,
      groundClearanceMm: 163,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(73_975, 7_450, 2_400),
    images: { gallery: [] },
    sources: [tvs('/tvs-jupiter'), src('BikeWale — TVS Jupiter', 'https://www.bikewale.com/tvs-bikes/jupiter/')],
  },

  {
    slug: 'jupiter-125',
    name: 'TVS Jupiter 125',
    category: 'scooter',
    rank: 2,
    featured: true,
    tagline: { en: 'More pull for the same running cost', hi: 'वही खर्चा, ज़्यादा दम' },
    blurb: {
      en: '125cc torque with 57 kmpl claimed efficiency and the largest boot in its class. The upgrade buyer’s scooter.',
      hi: '125cc का टॉर्क, दावा 57 kmpl का, और क्लास में सबसे बड़ी डिक्की। अपग्रेड करने वालों का स्कूटर।',
    },
    variants: [
      { name: 'Drum — Alloy Wheel', exShowroom: 87_171 },
      { name: 'Disc — Alloy Wheel', exShowroom: 92_157 },
      { name: 'DT SXC', exShowroom: 93_430 },
      { name: 'SmartXonnect', exShowroom: 95_772 },
    ],
    colours: [
      c('Starlight Blue Gloss', 'starlight-blue', '#2B4B8C', '#C9D2E4'),
      c('Titanium Grey Matte', 'titanium-grey', GREY, '#B8BCC4'),
      c('Meteor Red Gloss', 'meteor-red', RED, WHITE),
      c('Pristine White', 'pristine-white', WHITE, '#9AA0A8'),
    ],
    specs: {
      displacementCc: 124.8,
      power: '6.0 kW (8.15 PS) @ 6500 rpm',
      torque: '10.5 Nm @ 4500 rpm',
      cooling: 'air',
      transmission: 'cvt',
      mileageKmpl: 57,
      kerbWeightKg: 108,
      fuelTankL: 5.1,
      seatHeightMm: 765,
      wheelbaseMm: 1275,
      groundClearanceMm: 163,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(87_171, 7_900, 2_600),
    images: { gallery: [] },
    sources: [tvs('/tvs-jupiter-125'), src('BikeDekho — Jupiter 125 specifications', 'https://www.bikedekho.com/tvs/jupiter-125/specifications')],
  },

  {
    slug: 'ntorq-125',
    name: 'TVS NTORQ 125',
    category: 'scooter',
    rank: 3,
    featured: true,
    tagline: { en: 'The 125 that doesn’t behave like a commuter', hi: 'कम्यूटर जैसा बिल्कुल नहीं चलता' },
    blurb: {
      en: 'Bluetooth console with turn-by-turn navigation, race telemetry and a genuinely quick 125cc motor. Sells itself to riders under 30.',
      hi: 'Bluetooth कंसोल, turn-by-turn navigation, race telemetry और तेज़ 125cc इंजन। 30 से कम उम्र वालों की पहली पसंद।',
    },
    variants: [
      { name: 'Drum', exShowroom: 90_040 },
      { name: 'Disc', exShowroom: 96_120 },
      { name: 'Super Squad Edition', exShowroom: 1_00_320 },
      { name: 'Race XP', exShowroom: 1_05_145 },
    ],
    colours: [
      c('Stealth Black', 'stealth-black', INK, '#EC1B2E'),
      c('Amazing Red', 'amazing-red', '#C21326', '#2A2B30'),
      c('Nardo Grey', 'nardo-grey', '#8C9095', '#EC1B2E'),
      c('Blaze Blue', 'blaze-blue', '#1F4FA8', '#2A2B30'),
      c('Spiti White', 'spiti-white', WHITE, '#2A2B30'),
    ],
    specs: {
      displacementCc: 124.8,
      power: '6.9 kW (9.37 bhp) @ 7000 rpm',
      torque: '10.6 Nm @ 5500 rpm',
      cooling: 'air',
      transmission: 'cvt',
      mileageKmpl: 53,
      kerbWeightKg: 111,
      fuelTankL: 5.8,
      seatHeightMm: 770,
      wheelbaseMm: 1285,
      groundClearanceMm: 155,
      brakes: { front: 'disc', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'gasCharged' },
    },
    onRoad: onRoad(90_040, 8_100, 2_800),
    images: { gallery: [] },
    sources: [tvs('/tvs-ntorq'), src('BikeWale — NTORQ 125', 'https://www.bikewale.com/tvs-bikes/ntorq-125/')],
  },

  {
    slug: 'zest-110',
    name: 'TVS Zest 110',
    category: 'scooter',
    rank: 4,
    featured: false,
    tagline: { en: 'Light, simple, easy to park', hi: 'हल्का, आसान, कहीं भी खड़ा कर दीजिए' },
    blurb: {
      en: 'At 103 kg it is the easiest scooter here to wheel out of a crowded gali. Eight colours, and the lowest entry price of any TVS scooter.',
      hi: 'सिर्फ़ 103 किलो — भीड़ भरी गली से निकालना सबसे आसान। आठ रंग, और TVS स्कूटर में सबसे कम शुरुआती दाम।',
    },
    variants: [
      { name: 'Gloss', exShowroom: 70_560 },
      { name: 'Matte', exShowroom: 73_713 },
      { name: 'SXC', exShowroom: 77_058 },
    ],
    colours: [
      c('Pearl White', 'pearl-white', WHITE, '#9AA0A8'),
      c('Turquoise Blue', 'turquoise-blue', '#2F93AF', WHITE),
      c('Matte Blue', 'matte-blue', '#0F5191', SILVER),
      c('Purple', 'purple', '#5B3A78', WHITE),
      c('Matte Black', 'matte-black', '#2A2B30', '#8C9095'),
      c('Bold Black', 'bold-black', INK, SILVER),
      c('Graphite Grey', 'graphite-grey', '#4E5157', '#B8BCC4'),
      c('Titanium Grey', 'titanium-grey', GREY, '#B8BCC4'),
    ],
    specs: {
      displacementCc: 109.7,
      power: '5.67 kW (7.71 bhp) @ 7500 rpm',
      torque: '8.8 Nm @ 5500 rpm',
      cooling: 'air',
      transmission: 'cvt',
      mileageKmpl: 48,
      kerbWeightKg: 103,
      fuelTankL: 5,
      seatHeightMm: 760,
      wheelbaseMm: 1235,
      groundClearanceMm: 150,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(70_560, 7_200, 2_300),
    images: { gallery: [] },
    sources: [tvs('/tvs-zest'), src('BikeWale — Zest 110', 'https://www.bikewale.com/tvs-bikes/zest-110/')],
  },

  {
    slug: 'raider-125',
    name: 'TVS Raider 125',
    category: 'motorcycle',
    rank: 5,
    featured: true,
    tagline: { en: '125cc commuter, 56.7 kmpl claimed', hi: '125cc कम्यूटर, दावा 56.7 kmpl' },
    blurb: {
      en: 'Two ride modes, a gas-charged monoshock and the sharpest styling in the 125cc commuter class. Our highest-volume motorcycle.',
      hi: 'दो राइड मोड, gas-charged मोनोशॉक और 125cc कम्यूटर क्लास की सबसे शार्प स्टाइलिंग। सबसे ज़्यादा बिकने वाली बाइक।',
    },
    variants: [
      { name: 'Drum', exShowroom: 83_410 },
      { name: 'Disc', exShowroom: 89_650 },
      { name: 'SmartXonnect Disc', exShowroom: 94_200 },
      { name: 'TFT iGO Assist', exShowroom: 99_620 },
    ],
    colours: [
      // Names and photographs from TVS's own colour picker. The Marvel special
      // editions are real trim names, not nicknames we invented.
      c('Striking Red', 'striking-red', '#C4142B', INK),
      c('Wicked Black', 'wicked-black', INK, '#EC1B2E'),
      c('Nardo Grey', 'nardo-grey', '#8C9095', '#C4142B'),
      c('Metallic Blue', 'metallic-blue', '#2F4B6E', SILVER),
      c('Nitro Green', 'nitro-green', '#7C8A3E', INK),
      c('Blazing Blue', 'blazing-blue', '#352E6C', SILVER),
      c('Mercury Grey', 'mercury-grey', '#6A7280', INK),
      c('Doomsday', 'doomsday', '#354D4C', SILVER),
      c('Deadpool', 'deadpool', '#8E1B22', INK),
      c('Wolverine', 'wolverine', '#1F6E6F', '#D9A21B'),
      c('Black Panther', 'black-panther', '#3E3350', SILVER),
      c('Iron Man', 'iron-man', '#8E0915', '#D9A21B'),
    ],
    specs: {
      displacementCc: 124.8,
      power: '8.37 kW (11.2 PS) @ 7500 rpm',
      torque: '11.2 Nm @ 6000 rpm',
      cooling: 'airOil',
      transmission: 'gear5',
      mileageKmpl: 56.7,
      kerbWeightKg: 123,
      fuelTankL: 10,
      seatHeightMm: 780,
      wheelbaseMm: 1326,
      groundClearanceMm: 180,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'gasCharged' },
    },
    onRoad: onRoad(83_410, 8_600, 2_600),
    images: { gallery: [] },
    sources: [tvs('/tvs-raider'), src('BikeWale — Raider 125', 'https://www.bikewale.com/tvs-bikes/raider-125/')],
  },

  {
    slug: 'sport',
    name: 'TVS Sport',
    category: 'motorcycle',
    rank: 6,
    featured: true,
    tagline: { en: 'The lowest cost per kilometre we sell', hi: 'सबसे कम खर्च प्रति किलोमीटर' },
    blurb: {
      en: '110cc, 110 kg, and built for daily distance on mixed roads. The pick for riders commuting in from Bilha or Masturi.',
      hi: '110cc, 110 किलो, और रोज़ लंबी दूरी के लिए बना। बिल्हा या मस्तूरी से आने-जाने वालों के लिए सही।',
    },
    variants: [
      { name: 'Kick Start Drum', exShowroom: 58_750 },
      { name: 'Electric Start Drum', exShowroom: 63_420 },
      { name: 'Electric Start Alloy', exShowroom: 66_180 },
    ],
    colours: [
      c('Black Red', 'black-red', '#25262B', '#C4142B'),
      c('Black Blue', 'black-blue', '#25262B', '#2B4B8C'),
      c('Grey Black', 'grey-black', '#6A6E74', INK),
      c('Black Silver', 'black-silver', '#25262B', SILVER),
    ],
    specs: {
      displacementCc: 109.7,
      power: '6.03 kW (8.19 PS) @ 7350 rpm',
      torque: '8.7 Nm @ 4500 rpm',
      cooling: 'air',
      transmission: 'gear4',
      mileageKmpl: 70,
      kerbWeightKg: 112,
      fuelTankL: 10,
      seatHeightMm: 770,
      wheelbaseMm: 1245,
      groundClearanceMm: 180,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'twinShock' },
    },
    onRoad: onRoad(58_750, 7_100, 2_200),
    images: { gallery: [] },
    sources: [tvs('/tvs-sport'), src('BikeDekho — TVS Sport specifications', 'https://www.bikedekho.com/tvs/sport/specifications')],
  },

  {
    slug: 'star-city-plus',
    name: 'TVS Star City Plus',
    category: 'motorcycle',
    rank: 7,
    featured: true,
    tagline: { en: 'Comfort-first 110, built for bad roads', hi: 'खराब सड़कों के लिए बना आरामदायक 110' },
    blurb: {
      en: 'Longest seat in the class, 5-step adjustable rear suspension and TVS’s highest claimed efficiency figure.',
      hi: 'क्लास की सबसे लंबी सीट, 5-स्टेप एडजस्टेबल रियर सस्पेंशन और TVS का सबसे ज़्यादा माइलेज दावा।',
    },
    variants: [
      { name: 'Drum', exShowroom: 72_500 },
      { name: 'Disc', exShowroom: 76_020 },
    ],
    colours: [
      c('Black Red', 'black-red', '#25262B', '#C4142B'),
      c('Black Green', 'black-green', '#25262B', '#1E6B4A'),
      c('Black Blue', 'black-blue', '#25262B', '#2B4B8C'),
      c('Grey Black', 'grey-black', '#6A6E74', INK),
    ],
    specs: {
      displacementCc: 109.7,
      power: '5.94 kW (8.08 PS) @ 7350 rpm',
      torque: '8.7 Nm @ 4500 rpm',
      cooling: 'air',
      transmission: 'gear4',
      mileageKmpl: 83,
      kerbWeightKg: 115,
      fuelTankL: 10,
      seatHeightMm: 785,
      wheelbaseMm: 1260,
      groundClearanceMm: 180,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'twinShock' },
    },
    onRoad: onRoad(72_500, 7_400, 2_300),
    images: { gallery: [] },
    sources: [tvs('/tvs-star-city-plus'), src('ZigWheels — Star City Plus', 'https://www.zigwheels.com/tvs-bikes/star-city-plus/')],
  },

  {
    slug: 'radeon',
    name: 'TVS Radeon',
    category: 'motorcycle',
    rank: 8,
    featured: true,
    tagline: { en: '73.68 kmpl claimed — the mileage bike', hi: 'दावा 73.68 kmpl — माइलेज वाली बाइक' },
    blurb: {
      en: 'Classic looks, a 110cc motor tuned for economy and TVS’s highest ARAI figure on a motorcycle. Twelve colours to choose from.',
      hi: 'क्लासिक लुक, माइलेज के लिए ट्यून किया 110cc इंजन और मोटरसाइकिल में TVS का सबसे ज़्यादा ARAI आंकड़ा। बारह रंग।',
    },
    variants: [
      { name: 'All Black Edition', exShowroom: 73_715 },
      { name: 'Drum', exShowroom: 76_990 },
      { name: 'Digital — Drum', exShowroom: 80_939 },
      { name: 'Digital — Disc', exShowroom: 83_304 },
    ],
    colours: [
      c('Metal Black', 'metal-black', INK, SILVER),
      c('All Black', 'all-black', '#25262B', '#4E5157'),
      c('Black', 'black', '#2C2B2C', SILVER),
      c('DT Blue Black', 'dt-blue-black', '#2D48B3', INK),
      c('DT Red Black', 'dt-red-black', '#B3302E', INK),
      c('Starlight Blue', 'starlight-blue', '#064756', SILVER),
      c('Royal Purple', 'royal-purple', '#4A2F63', SILVER),
      c('Titanium Grey', 'titanium-grey', GREY, '#B8BCC4'),
    ],
    specs: {
      displacementCc: 109.7,
      power: '6.03 kW (8.08 bhp) @ 7350 rpm',
      torque: '8.7 Nm @ 4500 rpm',
      cooling: 'air',
      transmission: 'gear4',
      mileageKmpl: 73.68,
      kerbWeightKg: 113,
      fuelTankL: 10,
      seatHeightMm: 785,
      wheelbaseMm: 1265,
      groundClearanceMm: 180,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'twinShock' },
    },
    onRoad: onRoad(73_715, 7_400, 2_300),
    images: { gallery: [] },
    sources: [tvs('/tvs-radeon'), src('ZigWheels — Radeon specifications', 'https://www.zigwheels.com/tvs-bikes/radeon/specifications/')],
  },

  {
    slug: 'xl100',
    name: 'TVS XL100 Heavy Duty',
    category: 'moped',
    rank: 9,
    featured: false,
    tagline: { en: 'The working vehicle — 130 kg payload', hi: 'काम की गाड़ी — 130 किलो तक लोड' },
    blurb: {
      en: '99.7cc tuned for low-speed pull, 89 kg kerb weight and a claimed 65 kmpl. Sells to shopkeepers, dairies and dhaba supply runs.',
      hi: '99.7cc, कम स्पीड पर ज़्यादा खिंचाव, 89 किलो वज़न और दावा 65 kmpl। दुकानदार, डेयरी और सप्लाई के काम के लिए।',
    },
    variants: [
      { name: 'Comfort i-Touchstart', exShowroom: 47_889 },
      { name: 'Heavy Duty', exShowroom: 52_340 },
      { name: 'Heavy Duty i-Touchstart', exShowroom: 56_120 },
    ],
    colours: [
      // TVS lists these by plain colour rather than a trim name.
      c('Blue', 'blue', '#3B7EA8', '#25262B'),
      c('Green', 'green', '#1E6B4A', '#25262B'),
      c('Black', 'black', '#25262B', SILVER),
    ],
    specs: {
      displacementCc: 99.7,
      power: '3.20 kW (4.3 bhp) @ 6000 rpm',
      torque: '6.5 Nm @ 3500 rpm',
      cooling: 'air',
      transmission: 'automatic',
      mileageKmpl: 65,
      kerbWeightKg: 88,
      fuelTankL: 4,
      seatHeightMm: 780,
      wheelbaseMm: 1190,
      groundClearanceMm: 170,
      brakes: { front: 'drum', rear: 'drum', system: 'none' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(47_889, 6_400, 1_800),
    images: { gallery: [] },
    sources: [tvs('/tvs-xl100/tvs-xl100-heavy-duty'), src('ZigWheels — XL100 specifications', 'https://www.zigwheels.com/tvs-bikes/xl100/specifications/')],
  },

  {
    slug: 'iqube',
    name: 'TVS iQube',
    category: 'electric',
    rank: 10,
    featured: true,
    tagline: { en: 'About ₹0.20 per kilometre to run', hi: 'चलाने का खर्च लगभग ₹0.20 प्रति किलोमीटर' },
    blurb: {
      en: 'India’s best-selling electric scooter, in battery sizes from 2.2 kWh up. Charges from an ordinary 5A socket at home.',
      hi: 'भारत में सबसे ज़्यादा बिकने वाला इलेक्ट्रिक स्कूटर, 2.2 kWh से ऊपर तक के बैटरी विकल्प। घर के आम 5A सॉकेट से चार्ज।',
    },
    variants: [
      { name: 'iQube 2.2 kWh', exShowroom: 1_16_310, note: { en: 'Claimed range 94 km', hi: 'दावा रेंज 94 km' } },
      { name: 'iQube 3.1 kWh', exShowroom: 1_27_000, note: { en: 'Claimed range 123 km', hi: 'दावा रेंज 123 km' } },
      { name: 'iQube 3.5 kWh', exShowroom: 1_38_495, note: { en: 'Claimed range 145 km', hi: 'दावा रेंज 145 km' } },
      { name: 'iQube S 4.7 kWh', exShowroom: 1_45_640, note: { en: 'Claimed range 175 km', hi: 'दावा रेंज 175 km' } },
    ],
    colours: [
      c('Pearl White', 'pearl-white', WHITE, '#7E838B'),
      c('Titanium Grey', 'titanium-grey', GREY, '#B8BCC4'),
      c('Starlight Blue Beige', 'starlight-blue', '#2F4A78', '#D8CDB8'),
      c('Copper Brown Beige', 'copper-brown', '#8A5A3B', '#D8CDB8'),
      c('Aurora Green', 'aurora-green', '#2F6B57', WHITE),
      c('Walnut Brown', 'walnut-brown', '#5C4033', '#D8CDB8'),
    ],
    specs: {
      batteryKwh: 2.2,
      power: '3.0 kW rated / 4.4 kW peak',
      torque: '33 Nm at wheel',
      cooling: 'none',
      transmission: 'automatic',
      rangeKm: 94,
      kerbWeightKg: 117,
      chargeTimeHrs: 4.5,
      seatHeightMm: 770,
      wheelbaseMm: 1301,
      groundClearanceMm: 157,
      brakes: { front: 'disc', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(1_16_310, 8_400, 3_000),
    images: { gallery: [] },
    sources: [tvs('/electric-scooters/tvs-iqube'), src('ZigWheels — iQube', 'https://www.zigwheels.com/tvs-bikes/iqube-electric/')],
  },

  {
    slug: 'orbiter',
    name: 'TVS Orbiter',
    category: 'electric',
    rank: 11,
    featured: true,
    tagline: { en: 'The electric built to replace a petrol commuter', hi: 'पेट्रोल स्कूटर की जगह लेने के लिए बना इलेक्ट्रिक' },
    blurb: {
      en: 'TVS’s mass-market EV: 3.1 kWh, a claimed 158 km, a tall 845 mm seat and 33 litres of underseat storage.',
      hi: 'TVS का आम आदमी वाला EV: 3.1 kWh, दावा 158 km, ऊँची 845 mm सीट और 33 लीटर अंडरसीट स्टोरेज।',
    },
    variants: [
      { name: 'Orbiter V1', exShowroom: 1_02_459, note: { en: '1.8 kWh pack', hi: '1.8 kWh बैटरी' } },
      { name: 'Orbiter V2', exShowroom: 1_18_887, note: { en: '3.1 kWh pack, claimed 158 km', hi: '3.1 kWh बैटरी, दावा 158 km' } },
    ],
    colours: [
      c('Neon Sunburst', 'neon-sunburst', '#D9A21B', '#25262B'),
      c('Stratos Blue', 'stratos-blue', '#2B4B8C', SILVER),
      c('Lunar Grey', 'lunar-grey', GREY, '#B8BCC4'),
      c('Martian Copper', 'martian-copper', '#8A5A3B', '#D8CDB8'),
      c('Cosmic Titanium', 'cosmic-titanium', '#4E5157', SILVER),
      c('Stellar Silver', 'stellar-silver', SILVER, '#7E838B'),
    ],
    specs: {
      batteryKwh: 3.1,
      power: '3.0 kW peak, hub motor',
      torque: '—',
      cooling: 'none',
      transmission: 'automatic',
      rangeKm: 158,
      kerbWeightKg: 122,
      chargeTimeHrs: 5,
      seatHeightMm: 845,
      wheelbaseMm: 1320,
      groundClearanceMm: 160,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(1_18_887, 8_400, 3_000),
    images: { gallery: [] },
    sources: [tvs('/electric-scooters/tvs-orbiter'), src('BikeWale — Orbiter', 'https://www.bikewale.com/tvs-bikes/orbiter/')],
  },

  {
    slug: 'apache-rtr-160',
    name: 'TVS Apache RTR 160',
    category: 'motorcycle',
    rank: 12,
    featured: false,
    tagline: { en: 'Race-derived 160, road-legal manners', hi: 'रेसिंग से आया 160, सड़क के लिए तैयार' },
    blurb: {
      en: 'Glide Through Traffic technology and a chassis with genuine racing lineage. The Apache that starts the family.',
      hi: 'Glide Through Traffic टेक्नोलॉजी और असली रेसिंग वाला चेसिस। Apache परिवार की शुरुआत।',
    },
    variants: [
      { name: 'Drum', exShowroom: 1_13_000 },
      { name: 'Single Disc', exShowroom: 1_18_400 },
      { name: 'Double Disc', exShowroom: 1_24_650 },
    ],
    colours: [
      c('Racing Red', 'racing-red', '#C4142B', INK),
      c('Metallic Black', 'metallic-black', INK, '#8C9095'),
      c('Pearl White', 'pearl-white', WHITE, '#C4142B'),
    ],
    specs: {
      displacementCc: 159.7,
      power: '11.79 kW (15.82 bhp) @ 8750 rpm',
      torque: '13.85 Nm @ 7000 rpm',
      cooling: 'air',
      transmission: 'gear5',
      mileageKmpl: 45,
      kerbWeightKg: 138,
      fuelTankL: 12,
      seatHeightMm: 800,
      wheelbaseMm: 1300,
      groundClearanceMm: 180,
      brakes: { front: 'disc', rear: 'drum', system: 'abs' },
      suspension: { front: 'telescopic', rear: 'monoshock' },
    },
    onRoad: onRoad(1_13_000, 9_800, 3_200),
    images: { gallery: [] },
    sources: [tvs('/tvs-apache/apache-rtr-160-2v'), src('BikeDekho — Apache RTR 160', 'https://www.bikedekho.com/tvs/apache-rtr-160/specifications')],
  },

  {
    slug: 'apache-rtr-160-4v',
    name: 'TVS Apache RTR 160 4V',
    category: 'motorcycle',
    rank: 13,
    featured: true,
    tagline: { en: 'The most powerful 160 you can buy', hi: 'सबसे दमदार 160' },
    blurb: {
      en: 'The 2026 update brings a projector headlamp, all-LED lighting and an assist-and-slipper clutch to the class leader.',
      hi: '2026 वाला अपडेट — प्रोजेक्टर हेडलैंप, पूरी LED लाइटिंग और assist-and-slipper क्लच।',
    },
    variants: [
      { name: 'Drum', exShowroom: 1_25_440 },
      { name: 'Single Channel ABS', exShowroom: 1_32_900 },
      { name: 'Dual Channel ABS', exShowroom: 1_41_500 },
    ],
    colours: [
      c('Pearl White', 'pearl-white', WHITE, '#C4142B'),
      c('Metallic Blue', 'metallic-blue', '#1F4FA8', INK),
      c('Knight Black', 'knight-black', INK, '#8C9095'),
      c('Racing Red', 'racing-red', '#C4142B', INK),
    ],
    specs: {
      displacementCc: 159.7,
      power: '13.3 kW (17.85 PS) @ 9250 rpm',
      torque: '14.73 Nm @ 7500 rpm',
      cooling: 'airOil',
      transmission: 'gear5',
      mileageKmpl: 45,
      kerbWeightKg: 143,
      fuelTankL: 12,
      seatHeightMm: 800,
      wheelbaseMm: 1357,
      groundClearanceMm: 180,
      brakes: { front: 'disc', rear: 'disc', system: 'abs' },
      suspension: { front: 'telescopic', rear: 'monoshock' },
    },
    onRoad: onRoad(1_25_440, 10_200, 3_200),
    images: { gallery: [] },
    sources: [
      tvs('/tvs-apache/apache-rtr-160-4v'),
      src('TVS press release — 2026 Apache RTR 160 4V', 'https://www.tvsmotor.com/media/press-release/all-new-2026-tvs-apache-rtr-160-4v-most-powerful-160cc-motorcycle-projector-headlamp'),
    ],
  },

  {
    slug: 'apache-rtr-180',
    name: 'TVS Apache RTR 180',
    category: 'motorcycle',
    rank: 14,
    featured: false,
    tagline: { en: '17 PS, 140 kg, and a very old grudge', hi: '17 PS, 140 किलो, और पुरानी दुश्मनी' },
    blurb: {
      en: 'The Apache that built the name. 177.4cc, front and rear discs, and enough torque low down to make traffic easy.',
      hi: 'वही Apache जिसने नाम बनाया। 177.4cc, आगे-पीछे डिस्क, और ट्रैफ़िक में काम आने वाला टॉर्क।',
    },
    variants: [
      { name: 'Drum', exShowroom: 1_26_500 },
      { name: 'ABS', exShowroom: 1_33_000 },
    ],
    colours: [
      c('Gloss Black', 'gloss-black', INK, SILVER),
      c('Pearl White', 'pearl-white', WHITE, '#C4142B'),
      c('Black Champagne Gold', 'black-champagne-gold', '#2A2B30', '#B79A6B'),
    ],
    specs: {
      displacementCc: 177.4,
      power: '12.51 kW (17.02 PS) @ 9000 rpm',
      torque: '15.5 Nm @ 7000 rpm',
      cooling: 'air',
      transmission: 'gear5',
      mileageKmpl: 45,
      kerbWeightKg: 140,
      fuelTankL: 12,
      seatHeightMm: 790,
      wheelbaseMm: 1326,
      groundClearanceMm: 180,
      brakes: { front: 'disc', rear: 'disc', system: 'abs' },
      suspension: { front: 'telescopic', rear: 'monoshock' },
    },
    onRoad: onRoad(1_26_500, 10_200, 3_200),
    images: { gallery: [] },
    sources: [tvs('/tvs-apache/apache-rtr-180'), src('ZigWheels — Apache RTR 180', 'https://www.zigwheels.com/tvs-bikes/apache-rtr-180/specifications/')],
  },

  {
    slug: 'apache-rtr-200-4v',
    name: 'TVS Apache RTR 200 4V',
    category: 'motorcycle',
    rank: 15,
    featured: false,
    tagline: { en: '20.8 PS, ride modes, oil-cooled', hi: '20.8 PS, राइड मोड, ऑयल-कूल्ड' },
    blurb: {
      en: 'Three ride modes, an adjustable suspension setup and Bluetooth with race telemetry. The step up before the 310s.',
      hi: 'तीन राइड मोड, एडजस्टेबल सस्पेंशन और race telemetry वाला Bluetooth। 310 से पहले वाला कदम।',
    },
    variants: [
      { name: 'Single Channel ABS', exShowroom: 1_37_000 },
      { name: 'Dual Channel ABS', exShowroom: 1_44_500 },
      { name: 'Dual Channel — Bluetooth', exShowroom: 1_50_000 },
    ],
    colours: [
      c('Matte Blue', 'matte-blue', '#2C4A7A', INK),
      c('Pearl White', 'pearl-white', WHITE, '#C4142B'),
      c('Gloss Black', 'gloss-black', INK, SILVER),
      c('Granite Grey', 'granite-grey', '#4E5157', '#B8BCC4'),
    ],
    specs: {
      displacementCc: 197.75,
      power: '15.31 kW (20.82 PS) @ 9000 rpm',
      torque: '17.25 Nm @ 7250 rpm',
      cooling: 'airOil',
      transmission: 'gear5',
      mileageKmpl: 40,
      kerbWeightKg: 151,
      fuelTankL: 12,
      seatHeightMm: 800,
      wheelbaseMm: 1353,
      groundClearanceMm: 180,
      brakes: { front: 'disc', rear: 'disc', system: 'abs' },
      suspension: { front: 'telescopic', rear: 'monoshock' },
    },
    onRoad: onRoad(1_37_000, 10_800, 3_400),
    images: { gallery: [] },
    sources: [tvs('/tvs-apache/apache-rtr-200-4v'), src('ZigWheels — Apache RTR 200 4V', 'https://www.zigwheels.com/tvs-bikes/apache-rtr-200-4v/specifications/')],
  },

  {
    slug: 'ronin',
    name: 'TVS Ronin',
    category: 'motorcycle',
    rank: 16,
    featured: false,
    tagline: { en: 'A modern-retro cruiser at 160 kg', hi: '160 किलो का मॉडर्न-रेट्रो क्रूज़र' },
    blurb: {
      en: '225.9cc, Showa upside-down forks, dual-channel ABS with rain and road modes. Nothing else in the range rides like it.',
      hi: '225.9cc, Showa upside-down फोर्क, rain और road मोड के साथ dual-channel ABS। रेंज में इस जैसी कोई नहीं।',
    },
    variants: [
      { name: 'Single Tone', exShowroom: 1_30_000 },
      { name: 'Dual Tone', exShowroom: 1_45_000 },
      { name: 'Triple Tone', exShowroom: 1_56_000 },
      { name: 'Special Edition', exShowroom: 1_62_640 },
    ],
    colours: [
      c('Magma Red', 'magma-red', '#9C2028', INK),
      c('Midnight Blue', 'midnight-blue', '#243B5C', SILVER),
      c('Nimbus Grey', 'nimbus-grey', '#6A6E74', INK),
      c('Glacier Silver', 'glacier-silver', SILVER, '#7E838B'),
      c('Lightning Black', 'lightning-black', INK, '#8C9095'),
      c('Charcoal Ember', 'charcoal-ember', '#3A3B40', '#B79A6B'),
    ],
    specs: {
      displacementCc: 225.9,
      power: '15.0 kW (20.4 PS) @ 7750 rpm',
      torque: '19.93 Nm @ 3750 rpm',
      cooling: 'airOil',
      transmission: 'gear5',
      mileageKmpl: 42,
      kerbWeightKg: 160,
      fuelTankL: 14,
      seatHeightMm: 795,
      wheelbaseMm: 1357,
      groundClearanceMm: 181,
      brakes: { front: 'disc', rear: 'disc', system: 'abs' },
      suspension: { front: 'usd', rear: 'monoshock' },
    },
    onRoad: onRoad(1_30_000, 11_200, 3_400),
    images: { gallery: [] },
    sources: [tvs('/tvs-ronin'), src('BikeWale — Ronin', 'https://www.bikewale.com/tvs-bikes/ronin/')],
  },

  {
    slug: 'apache-rtr-310',
    name: 'TVS Apache RTR 310',
    category: 'motorcycle',
    rank: 17,
    featured: false,
    tagline: { en: '35 bhp naked, stripped of everything else', hi: '35 bhp नेकेड, बाकी सब हटाकर' },
    blurb: {
      en: 'The RR 310’s engine in a naked frame, with traction control, cruise control and a bidirectional quickshifter on the higher trims.',
      hi: 'RR 310 वाला इंजन नेकेड फ्रेम में — traction control, cruise control और ऊपर वाले वेरिएंट में quickshifter।',
    },
    variants: [
      { name: 'Base', exShowroom: 2_21_000, note: { en: 'Black only', hi: 'सिर्फ़ काला' } },
      { name: 'Dynamic Kit', exShowroom: 2_41_000, note: { en: 'Adds bidirectional quickshifter', hi: 'quickshifter के साथ' } },
      { name: 'Dynamic Pro Kit', exShowroom: 2_90_000 },
    ],
    colours: [
      c('Arsenal Black', 'arsenal-black', INK, '#8C9095'),
      c('Fury Yellow', 'fury-yellow', '#D9A21B', INK),
      c('Fiery Red', 'fiery-red', '#C4142B', INK),
      c('Black Champagne Gold', 'black-champagne-gold', '#2A2B30', '#B79A6B'),
    ],
    specs: {
      displacementCc: 312.12,
      power: '26.2 kW (35.11 bhp) @ 9700 rpm',
      torque: '28.7 Nm @ 6650 rpm',
      cooling: 'liquid',
      transmission: 'gear6',
      mileageKmpl: 30,
      kerbWeightKg: 169,
      fuelTankL: 11,
      seatHeightMm: 800,
      wheelbaseMm: 1357,
      groundClearanceMm: 180,
      brakes: { front: 'disc', rear: 'disc', system: 'abs' },
      suspension: { front: 'usd', rear: 'monoshock' },
    },
    onRoad: onRoad(2_21_000, 14_500, 4_200),
    images: { gallery: [] },
    sources: [tvs('/tvs-apache/apache-rtr-310'), src('BikeWale — Apache RTR 310', 'https://www.bikewale.com/tvs-bikes/apache-rtr-310/')],
  },

  {
    slug: 'apache-rr-310',
    name: 'TVS Apache RR 310',
    category: 'motorcycle',
    rank: 18,
    featured: false,
    tagline: { en: 'The fully-faired flagship', hi: 'पूरी फेयरिंग वाला फ्लैगशिप' },
    blurb: {
      en: '37.5 bhp, four ride modes, 174 kg. TVS’s racing programme turned into something you can register and ride to work.',
      hi: '37.5 bhp, चार राइड मोड, 174 किलो। TVS का रेसिंग प्रोग्राम, सड़क पर चलने लायक बनाकर।',
    },
    variants: [
      { name: 'Base', exShowroom: 2_62_000 },
      { name: 'Dynamic Kit', exShowroom: 2_85_000 },
      { name: 'Dynamic Pro Kit', exShowroom: 3_15_000 },
    ],
    colours: [
      c('Sepang Blue Race Replica', 'sepang-blue', '#1B4F9C', WHITE),
      c('Bomber Grey', 'bomber-grey', '#4E5157', '#B8BCC4'),
      c('Racing Red', 'racing-red', '#C4142B', INK),
      c('Black Champagne Gold', 'black-champagne-gold', '#2A2B30', '#B79A6B'),
    ],
    specs: {
      displacementCc: 312.2,
      power: '27.9 kW (37.48 bhp) @ 9700 rpm',
      torque: '27.3 Nm @ 7700 rpm',
      cooling: 'liquid',
      transmission: 'gear6',
      mileageKmpl: 34,
      kerbWeightKg: 174,
      fuelTankL: 11,
      seatHeightMm: 810,
      wheelbaseMm: 1365,
      groundClearanceMm: 180,
      brakes: { front: 'disc', rear: 'disc', system: 'abs' },
      suspension: { front: 'usd', rear: 'monoshock' },
    },
    onRoad: onRoad(2_62_000, 16_000, 4_500),
    images: { gallery: [] },
    sources: [tvs('/tvs-apache/rr-310'), src('ZigWheels — Apache RR 310 specifications', 'https://www.zigwheels.com/tvs-bikes/apache-rr-310/specifications/')],
  },

  {
    slug: 'tvs-x',
    name: 'TVS X',
    category: 'electric',
    rank: 19,
    featured: false,
    tagline: { en: '0–40 in 2.5 seconds, 10.2-inch screen', hi: '0–40 सिर्फ़ 2.5 सेकंड में, 10.2 इंच स्क्रीन' },
    blurb: {
      en: 'The premium end of the electric range: 11 kW peak, a 4.44 kWh pack and three riding modes. A halo product, not a commuter.',
      hi: 'इलेक्ट्रिक रेंज का सबसे प्रीमियम: 11 kW पीक, 4.44 kWh बैटरी और तीन राइडिंग मोड। कम्यूटर नहीं, शौक की गाड़ी।',
    },
    variants: [{ name: 'TVS X', exShowroom: 2_66_000, note: { en: 'Claimed IDC range 159 km', hi: 'दावा IDC रेंज 159 km' } }],
    colours: [
      c('Sonic Silver', 'sonic-silver', SILVER, INK),
      c('Blazing Red', 'blazing-red', '#B4192A', INK),
    ],
    specs: {
      batteryKwh: 4.44,
      power: '11 kW peak',
      torque: '—',
      cooling: 'none',
      transmission: 'automatic',
      rangeKm: 159,
      kerbWeightKg: 126,
      chargeTimeHrs: 3,
      seatHeightMm: 800,
      wheelbaseMm: 1440,
      groundClearanceMm: 165,
      brakes: { front: 'disc', rear: 'disc', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'monoshock' },
    },
    onRoad: onRoad(2_66_000, 12_500, 4_000),
    images: { gallery: [] },
    sources: [tvs('/electric-scooters/tvs-x'), src('BikeWale — TVS X', 'https://www.bikewale.com/tvs-bikes/x/')],
  },
];

/* ------------------------------------------------------------------ */
/* Derived helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Attach the official photographs to the models.
 *
 * content/vehicle-images.json is generated from the files that are actually in
 * public/vehicles/, so a path here is a file that exists. Nothing is claimed on
 * the strength of a download that might have failed, and a model with no picture
 * yet renders the typeset plate instead — which is a design, not a broken image.
 *
 * Colours are matched by slug. TVS and our curated list agree on most names and
 * not on all of them; an unmatched colour keeps its swatch and falls back to the
 * model's own photograph, which is honest and is what the stage already does.
 */
const imagesBySlug = vehicleImages.models as Record<string, ModelImages | undefined>;

for (const vehicle of vehicles) {
  const found = imagesBySlug[vehicle.slug];
  if (!found) continue;

  // The large shot where there is one, the navigation thumbnail otherwise.
  const best = found.hero ?? found.card;
  if (best) vehicle.images.hero = best;
  vehicle.images.gallery = found.gallery;

  for (const colour of vehicle.colours) {
    const image = found.colours[colour.slug];
    if (image) colour.image = image;
  }
}

/** Intrinsic size of a downloaded photograph, so nothing reflows while it loads. */
export function imageSize(url: string): { width: number; height: number } {
  const slug = url.split('/')[2];
  return imagesBySlug[slug]?.sizes[url] ?? { width: 1400, height: 840 };
}

/**
 * The `srcset` for a photograph, so a card at 300px does not download the 800px
 * file. Returns an empty string when only one rendition exists, which is a valid
 * `srcset` to omit rather than a broken one to emit.
 */
export function imageSrcSet(url: string): string | undefined {
  const slug = url.split('/')[2];
  const widths = imagesBySlug[slug]?.widths[url];
  if (!widths || widths.length < 2) return undefined;

  const base = url.replace(/\.webp$/, '');
  const widest = Math.max(...widths);
  return widths
    .map((w) => `${w === widest ? url : `${base}-${w}.webp`} ${w}w`)
    .join(', ');
}

export const categories: VehicleCategory[] = ['scooter', 'motorcycle', 'moped', 'electric'];

export const byRank = [...vehicles].sort((a, b) => a.rank - b.rank);

export const featuredVehicles = byRank.filter((v) => v.featured).slice(0, 6);

export function getVehicle(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

export function priceFrom(v: Vehicle): number {
  return Math.min(...v.variants.map((x) => x.exShowroom));
}

/**
 * The colour a card and the model stage should open on.
 *
 * A colour with a photograph wins, because the alternative is the typeset plate.
 * Among those, the lightest reads best: the studio shots are on white, and a
 * Wicked Black next to a Striking Red is the less informative of the two at
 * card size. The colour list order is otherwise preserved.
 */
export function cardColour(v: Vehicle): ColourOption {
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const withPhoto = v.colours.filter((x) => x.image);
  const pool = withPhoto.length > 0 ? withPhoto : v.colours;
  return pool.reduce((best, x) => (luminance(x.hex) > luminance(best.hex) ? x : best));
}

/**
 * The photograph a card should show.
 *
 * The per-colour studio shots run 700–800px wide; the navigation's product image
 * is only 372. So a colour photo wins when there is one — it is the same bike in
 * the same treatment, just sharp enough for a card on a retina screen — and the
 * navigation image is the fallback for models that have no colour shots yet.
 */
export function cardImage(v: Vehicle): string | undefined {
  return cardColour(v).image ?? v.colours.find((x) => x.image)?.image ?? v.images.hero;
}
