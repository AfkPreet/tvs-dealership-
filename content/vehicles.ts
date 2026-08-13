/**
 * Vehicle data for the sample build.
 *
 * SOURCING NOTE — every figure below is INDICATIVE and carries the source and the
 * date it was read. Manufacturer prices and specifications change without notice;
 * the dealership must confirm against the current TVS dealer price circular before
 * these go live. The `sources` array on each model is rendered on the model page.
 *
 * ASSET NOTE — image paths resolve from this file only. The 360° frames currently
 * in /public/vehicles/<slug>/<colour>/ are stand-ins generated to the exact
 * commission spec (36 frames, 10° intervals, 15° camera elevation, fixed focal
 * length, 2000px canvas). Dropping the finished renders into the same folders is a
 * file replacement — no code change, no layout change.
 */

export type VehicleCategory = 'scooter' | 'motorcycle' | 'moped' | 'electric';

export type BrakeType = 'disc' | 'drum';
export type BrakeSystem = 'abs' | 'cbs' | 'none';
export type FrontSuspension = 'telescopic' | 'usd';
export type RearSuspension = 'monoshock' | 'gasCharged' | 'twinShock' | 'coilSpring';
export type Transmission = 'cvt' | 'gear5' | 'gear4' | 'automatic';
export type Cooling = 'air' | 'airOil' | 'liquid' | 'none';

/** Body form used by the 360° stand-in generator. */
export type RenderForm = 'scooter' | 'motorcycle' | 'moped' | 'escooter';

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
  /** Primary body hex, used for the swatch and the stand-in render sequence. */
  hex: string;
  /** Secondary/graphics hex. */
  accentHex: string;
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
  /** Commuter relevance for Bilaspur — drives homepage ordering. Lower is more prominent. */
  rank: number;
  featured: boolean;
  tagline: { en: string; hi: string };
  blurb: { en: string; hi: string };
  variants: Variant[];
  colours: ColourOption[];
  specs: Specs;
  onRoad: OnRoadBreakdown;
  render: {
    form: RenderForm;
    lengthMm: number;
    heightMm: number;
    wheelbaseMm: number;
    wheelDiaMm: number;
  };
  sources: { label: string; url: string; readOn: string }[];
};

/* ------------------------------------------------------------------ */
/* On-road maths — one formula, applied identically to every model.    */
/* ------------------------------------------------------------------ */

/**
 * Chhattisgarh two-wheeler lifetime road tax is levied at 4% of vehicle cost
 * (source: godigit.com/road-tax/chhattisgarh-road-tax, read 2026-08-13), plus
 * registration, HSRP number plate and smart card fees. Hypothecation (₹1,500) is
 * NOT included here because it applies only to financed purchases — it is shown
 * separately on the finance page instead.
 */
const ROAD_TAX_RATE = 0.04;
const FIXED_RTO_FEES = 1_100; // HSRP + smart card + registration processing

function onRoad(exShowroom: number, insurance: number, accessories: number): OnRoadBreakdown {
  const rto = Math.round(exShowroom * ROAD_TAX_RATE) + FIXED_RTO_FEES;
  return {
    exShowroom,
    rto,
    insurance,
    accessories,
    total: exShowroom + rto + insurance + accessories,
  };
}

const src = (label: string, url: string) => ({ label, url, readOn: '2026-08-13' });

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
      { name: 'Meteor Red Gloss', slug: 'meteor-red', hex: '#B4192A', accentHex: '#E4E6EA' },
      { name: 'Titanium Grey Matte', slug: 'titanium-grey', hex: '#5A5D63', accentHex: '#B8BCC4' },
      { name: 'Lunar White Gloss', slug: 'lunar-white', hex: '#E7E9ED', accentHex: '#9AA0A8' },
    ],
    specs: {
      displacementCc: 113.3,
      power: '5.9 kW (8.0 PS) @ 6500 rpm',
      torque: '9.8 Nm @ 5500 rpm',
      cooling: 'air',
      transmission: 'cvt',
      mileageKmpl: 53,
      kerbWeightKg: 106,
      fuelTankL: 5.1,
      seatHeightMm: 765,
      wheelbaseMm: 1275,
      groundClearanceMm: 163,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(73_975, 7_450, 2_400),
    render: { form: 'scooter', lengthMm: 1855, heightMm: 1165, wheelbaseMm: 1275, wheelDiaMm: 490 },
    sources: [
      src('tvsmotor.com — TVS Jupiter', 'https://www.tvsmotor.com/tvs-jupiter'),
      src('BikeWale — TVS Jupiter price & specs', 'https://www.bikewale.com/tvs-bikes/jupiter/'),
    ],
  },

  {
    slug: 'jupiter-125',
    name: 'TVS Jupiter 125',
    category: 'scooter',
    rank: 2,
    featured: true,
    tagline: {
      en: 'More pull for the same running cost',
      hi: 'वही खर्चा, ज़्यादा दम',
    },
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
      { name: 'Starlight Blue Gloss', slug: 'starlight-blue', hex: '#2B4B8C', accentHex: '#C9D2E4' },
      { name: 'Titanium Grey Matte', slug: 'titanium-grey', hex: '#5A5D63', accentHex: '#B8BCC4' },
      { name: 'Meteor Red Gloss', slug: 'meteor-red', hex: '#B4192A', accentHex: '#E4E6EA' },
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
    render: { form: 'scooter', lengthMm: 1852, heightMm: 1168, wheelbaseMm: 1275, wheelDiaMm: 500 },
    sources: [
      src('tvsmotor.com — TVS Jupiter 125', 'https://www.tvsmotor.com/tvs-jupiter-125'),
      src('BikeDekho — Jupiter 125 specifications', 'https://www.bikedekho.com/tvs/jupiter-125/specifications'),
    ],
  },

  {
    slug: 'ntorq-125',
    name: 'TVS NTORQ 125',
    category: 'scooter',
    rank: 3,
    featured: true,
    tagline: {
      en: 'The 125 that doesn’t behave like a commuter',
      hi: 'कम्यूटर जैसा बिल्कुल नहीं चलता',
    },
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
      { name: 'Stealth Black', slug: 'stealth-black', hex: '#1B1C20', accentHex: '#EC1B2E' },
      { name: 'Amazing Red', slug: 'amazing-red', hex: '#C21326', accentHex: '#2A2B30' },
      { name: 'Nardo Grey', slug: 'nardo-grey', hex: '#8C9095', accentHex: '#EC1B2E' },
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
    render: { form: 'scooter', lengthMm: 1861, heightMm: 1164, wheelbaseMm: 1285, wheelDiaMm: 510 },
    sources: [
      src('tvsmotor.com — NTORQ technical specification', 'https://www.tvsmotor.com/tvs-ntorq/technical-specification'),
      src('BikeWale — NTORQ 125 price & specs', 'https://www.bikewale.com/tvs-bikes/ntorq-125/'),
    ],
  },

  {
    slug: 'raider-125',
    name: 'TVS Raider 125',
    category: 'motorcycle',
    rank: 4,
    featured: true,
    tagline: {
      en: '125cc commuter, 56.7 kmpl claimed',
      hi: '125cc कम्यूटर, दावा 56.7 kmpl',
    },
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
      { name: 'Striking Red', slug: 'striking-red', hex: '#C4142B', accentHex: '#1B1C20' },
      { name: 'Wicked Black', slug: 'wicked-black', hex: '#1B1C20', accentHex: '#EC1B2E' },
      { name: 'Nardo Grey', slug: 'nardo-grey', hex: '#8C9095', accentHex: '#C4142B' },
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
    render: { form: 'motorcycle', lengthMm: 2010, heightMm: 1080, wheelbaseMm: 1326, wheelDiaMm: 590 },
    sources: [
      src('tvsmotor.com — Raider specifications', 'https://www.tvsmotor.com/tvs-raider/specifications'),
      src('BikeWale — Raider 125 price & variants', 'https://www.bikewale.com/tvs-bikes/raider-125/'),
    ],
  },

  {
    slug: 'sport',
    name: 'TVS Sport',
    category: 'motorcycle',
    rank: 5,
    featured: true,
    tagline: {
      en: 'The lowest cost per kilometre we sell',
      hi: 'सबसे कम खर्च प्रति किलोमीटर',
    },
    blurb: {
      en: '110cc, 110 kg, and built for daily distance on mixed roads. The pick for riders commuting in from Bilha or Masturi.',
      hi: '110cc, 110 किलो, और रोज़ लंबी दूरी के लिए बना। बिल्हा या मस्तूरी से आने-जाने वालों के लिए सही।',
    },
    variants: [
      { name: 'Kick Start Drum', exShowroom: 57_950 },
      { name: 'Electric Start Drum', exShowroom: 63_420 },
      { name: 'Electric Start Alloy', exShowroom: 66_180 },
    ],
    colours: [
      { name: 'Black Red', slug: 'black-red', hex: '#25262B', accentHex: '#C4142B' },
      { name: 'Black Blue', slug: 'black-blue', hex: '#25262B', accentHex: '#2B4B8C' },
      { name: 'Grey Black', slug: 'grey-black', hex: '#6A6E74', accentHex: '#1B1C20' },
    ],
    specs: {
      displacementCc: 109.7,
      power: '6.03 kW (8.19 PS) @ 7350 rpm',
      torque: '8.7 Nm @ 4500 rpm',
      cooling: 'air',
      transmission: 'gear4',
      mileageKmpl: 70,
      kerbWeightKg: 110,
      fuelTankL: 10,
      seatHeightMm: 770,
      wheelbaseMm: 1245,
      groundClearanceMm: 180,
      brakes: { front: 'drum', rear: 'drum', system: 'cbs' },
      suspension: { front: 'telescopic', rear: 'twinShock' },
    },
    onRoad: onRoad(57_950, 7_100, 2_200),
    render: { form: 'motorcycle', lengthMm: 1980, heightMm: 1065, wheelbaseMm: 1245, wheelDiaMm: 560 },
    sources: [
      src('tvsmotor.com — TVS Sport', 'https://www.tvsmotor.com/tvs-sport'),
      src('BikeDekho — TVS Sport specifications', 'https://www.bikedekho.com/tvs/sport/specifications'),
    ],
  },

  {
    slug: 'star-city-plus',
    name: 'TVS Star City Plus',
    category: 'motorcycle',
    rank: 6,
    featured: true,
    tagline: {
      en: 'Comfort-first 110, built for bad roads',
      hi: 'खराब सड़कों के लिए बना आरामदायक 110',
    },
    blurb: {
      en: 'Longest seat in the class, 5-step adjustable rear suspension and TVS’s highest claimed efficiency figure.',
      hi: 'क्लास की सबसे लंबी सीट, 5-स्टेप एडजस्टेबल रियर सस्पेंशन और TVS का सबसे ज़्यादा माइलेज दावा।',
    },
    variants: [
      { name: 'Drum', exShowroom: 72_022 },
      { name: 'Disc', exShowroom: 75_544 },
    ],
    colours: [
      { name: 'Black Red', slug: 'black-red', hex: '#25262B', accentHex: '#C4142B' },
      { name: 'Black Green', slug: 'black-green', hex: '#25262B', accentHex: '#1E6B4A' },
      { name: 'Black Blue', slug: 'black-blue', hex: '#25262B', accentHex: '#2B4B8C' },
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
    onRoad: onRoad(72_022, 7_400, 2_300),
    render: { form: 'motorcycle', lengthMm: 2007, heightMm: 1085, wheelbaseMm: 1260, wheelDiaMm: 570 },
    sources: [
      src('tvsmotor.com — Star City Plus', 'https://www.tvsmotor.com/tvs-star-city-plus'),
      src('ZigWheels — Star City Plus price & specs', 'https://www.zigwheels.com/tvs-bikes/star-city-plus/'),
    ],
  },

  {
    slug: 'apache-rtr-160',
    name: 'TVS Apache RTR 160',
    category: 'motorcycle',
    rank: 7,
    featured: false,
    tagline: {
      en: 'Race-derived 160, road-legal manners',
      hi: 'रेसिंग से आया 160, सड़क के लिए तैयार',
    },
    blurb: {
      en: 'Glide Through Traffic technology, three ride modes on the 4V and a chassis with genuine racing lineage.',
      hi: 'Glide Through Traffic टेक्नोलॉजी, 4V पर तीन राइड मोड और असली रेसिंग वाला चेसिस।',
    },
    variants: [
      { name: 'Drum', exShowroom: 1_09_971 },
      { name: 'Single Disc', exShowroom: 1_15_400 },
      { name: 'Double Disc', exShowroom: 1_21_650 },
    ],
    colours: [
      { name: 'Racing Red', slug: 'racing-red', hex: '#C4142B', accentHex: '#1B1C20' },
      { name: 'Metallic Black', slug: 'metallic-black', hex: '#1B1C20', accentHex: '#8C9095' },
      { name: 'Pearl White', slug: 'pearl-white', hex: '#E7E9ED', accentHex: '#C4142B' },
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
    onRoad: onRoad(1_09_971, 9_800, 3_200),
    render: { form: 'motorcycle', lengthMm: 2085, heightMm: 1105, wheelbaseMm: 1300, wheelDiaMm: 600 },
    sources: [
      src('tvsmotor.com — Apache RTR 160', 'https://www.tvsmotor.com/tvs-apache/apache-rtr-160-2v'),
      src('BikeDekho — Apache RTR 160 specifications', 'https://www.bikedekho.com/tvs/apache-rtr-160/specifications'),
    ],
  },

  {
    slug: 'iqube',
    name: 'TVS iQube',
    category: 'electric',
    rank: 8,
    featured: false,
    tagline: {
      en: 'About ₹0.20 per kilometre to run',
      hi: 'चलाने का खर्च लगभग ₹0.20 प्रति किलोमीटर',
    },
    blurb: {
      en: 'Five battery options up to 5.3 kWh, a claimed 175 km on the 4.7 kWh pack, and home charging from a standard 5A socket.',
      hi: '5.3 kWh तक पाँच बैटरी विकल्प, 4.7 kWh पैक पर दावा 175 km, और घर के आम 5A सॉकेट से चार्जिंग।',
    },
    variants: [
      { name: 'iQube 2.2 kWh', exShowroom: 1_19_236, note: { en: 'Claimed range 94 km', hi: 'दावा रेंज 94 km' } },
      { name: 'iQube 3.5 kWh', exShowroom: 1_38_495, note: { en: 'Claimed range 145 km', hi: 'दावा रेंज 145 km' } },
      { name: 'iQube S 4.7 kWh', exShowroom: 1_45_640, note: { en: 'Claimed range 175 km', hi: 'दावा रेंज 175 km' } },
    ],
    colours: [
      { name: 'Pearl White', slug: 'pearl-white', hex: '#E7E9ED', accentHex: '#7E838B' },
      { name: 'Titanium Grey', slug: 'titanium-grey', hex: '#5A5D63', accentHex: '#B8BCC4' },
      { name: 'Starlight Blue Beige', slug: 'starlight-blue', hex: '#2F4A78', accentHex: '#D8CDB8' },
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
    onRoad: onRoad(1_19_236, 8_400, 3_000),
    render: { form: 'escooter', lengthMm: 1805, heightMm: 1140, wheelbaseMm: 1301, wheelDiaMm: 500 },
    sources: [
      src('tvsmotor.com — TVS iQube', 'https://www.tvsmotor.com/electric-scooters/tvs-iqube'),
      src('ZigWheels — iQube range & charging', 'https://www.zigwheels.com/tvs-bikes/iqube-electric/'),
    ],
  },

  {
    slug: 'xl100',
    name: 'TVS XL100 Heavy Duty',
    category: 'moped',
    rank: 9,
    featured: false,
    tagline: {
      en: 'The working vehicle — 130 kg payload',
      hi: 'काम की गाड़ी — 130 किलो तक लोड',
    },
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
      { name: 'Fiery Yellow', slug: 'fiery-yellow', hex: '#D9A21B', accentHex: '#25262B' },
      { name: 'Blazing Red', slug: 'blazing-red', hex: '#B4192A', accentHex: '#25262B' },
      { name: 'Deep Green', slug: 'deep-green', hex: '#1E6B4A', accentHex: '#25262B' },
    ],
    specs: {
      displacementCc: 99.7,
      power: '3.2 kW (4.35 PS) @ 6000 rpm',
      torque: '6.5 Nm @ 3500 rpm',
      cooling: 'air',
      transmission: 'automatic',
      mileageKmpl: 65,
      kerbWeightKg: 89,
      fuelTankL: 4,
      seatHeightMm: 780,
      wheelbaseMm: 1190,
      groundClearanceMm: 170,
      brakes: { front: 'drum', rear: 'drum', system: 'none' },
      suspension: { front: 'telescopic', rear: 'coilSpring' },
    },
    onRoad: onRoad(47_889, 6_400, 1_800),
    render: { form: 'moped', lengthMm: 1980, heightMm: 1040, wheelbaseMm: 1190, wheelDiaMm: 530 },
    sources: [
      src('tvsmotor.com — XL100 Heavy Duty', 'https://www.tvsmotor.com/tvs-xl100/tvs-xl100-heavy-duty'),
      src('ZigWheels — XL100 specifications', 'https://www.zigwheels.com/tvs-bikes/xl100/specifications/'),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Derived helpers — used by pages and by the asset generator.         */
/* ------------------------------------------------------------------ */

export const categories: VehicleCategory[] = ['scooter', 'motorcycle', 'moped', 'electric'];

export const byRank = [...vehicles].sort((a, b) => a.rank - b.rank);

export const featuredVehicles = byRank.filter((v) => v.featured).slice(0, 6);

export function getVehicle(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

export function priceFrom(v: Vehicle): number {
  return Math.min(...v.variants.map((x) => x.exShowroom));
}

/** The 36-frame stand-in sequence lives here; finished renders drop into the same path. */
export function framePath(slug: string, colourSlug: string, frame: number): string {
  return `/vehicles/${slug}/${colourSlug}/frame-${String(frame).padStart(2, '0')}.svg`;
}

/**
 * The card/hero angle: frame 3 is 30° off the side view — a three-quarter that
 * shows the vehicle's width, which a flat profile cannot.
 */
export const HERO_FRAME = 3;

export function heroPath(slug: string, colourSlug: string): string {
  return framePath(slug, colourSlug, HERO_FRAME);
}

/**
 * Cards sit on --ink, so a Stealth Black NTORQ on a near-black ground disappears.
 * Pick the model's most legible official colour for the card image; the model
 * page still opens on the first colour in the list.
 */
export function cardColour(v: Vehicle): ColourOption {
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  return v.colours.reduce((best, c) => (luminance(c.hex) > luminance(best.hex) ? c : best));
}

export const TOTAL_FRAMES = 36;
/** Mobile drops to every third frame — same files, a third of the bytes. */
export const REDUCED_FRAME_STEP = 3;
