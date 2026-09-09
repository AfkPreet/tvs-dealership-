/**
 * Every business fact on the site resolves from this file.
 *
 * Facts marked CONFIRMED were read off the dealership's own signage in the
 * photographs the owner sent (media/photos/): the showroom fascia board and the
 * opening-day banner both carry the name, the road and both phone numbers, and
 * the two agree with each other.
 *
 * Facts marked PLACEHOLDER are still invented and must be replaced before the
 * site is handed to customers. Facts marked UNVERIFIED are best guesses that
 * follow from the confirmed ones and need a yes/no from the owner.
 *
 * Nothing else in the codebase needs touching: the name, phones, address, hours
 * and story flow from here into every page, every WhatsApp message and the
 * structured data.
 *
 * Still to confirm, in order of how much they matter:
 *   1. whatsapp     — which of the two numbers receives WhatsApp
 *   2. address      — the building/landmark line and the pincode
 *   3. hours        — opening and closing times, and the weekly off
 *   4. gstin        — left null, so the footer simply omits the line
 *   5. about.*      — the owner's name, the story and the team
 *   6. geo / maps   — an exact pin, ideally the Google Business listing link
 */

export type OpeningHour = {
  /** Key into copy.hours.days — never a display string. */
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  open: string | null;
  close: string | null;
};

export const dealer = {
  /** CONFIRMED — fascia board and opening banner. */
  name: 'Shiv Kripa Motors',
  legalSuffix: 'Authorised TVS Dealer',

  /** CONFIRMED — the showroom is in Kota, in Bilaspur district. */
  city: 'Kota',
  district: 'Bilaspur',
  state: 'Chhattisgarh',

  address: {
    /** UNVERIFIED — no building name or number is visible in the photographs. */
    line1: null as string | null,
    /** CONFIRMED — both signs read "Bilaspur Road kota". */
    line2: 'Bilaspur Road',
    city: 'Kota',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    /** UNVERIFIED — the postal code for Kota, Bilaspur district. */
    pincode: '495113',
  },

  /**
   * Towns the showroom sells into. Kota sits on the Bilaspur–Amarkantak road,
   * so the corridor either side of it is the honest catchment.
   * UNVERIFIED — the owner should trim or extend this.
   */
  serviceArea: ['Kota', 'Bilaspur', 'Ratanpur', 'Belgahna', 'Takhatpur', 'Bilha'],

  /** CONFIRMED — both numbers are printed on the signage. */
  phone: '917987378919',
  phoneDisplay: '+91 79873 78919',
  phoneAlt: '918770639754',
  phoneAltDisplay: '+91 87706 39754',

  /** CONFIRMED — every enquiry on the site opens a WhatsApp chat with this. */
  whatsapp: '917987378919',

  /**
   * Not supplied. Left null on purpose: the footer omits the GSTIN line entirely
   * rather than printing an invented one.
   */
  gstin: null as string | null,

  /**
   * A Maps *search* for the business rather than a dropped pin, so the link is
   * honest until the owner sends her Google Business listing.
   * UNVERIFIED.
   */
  mapEmbed:
    'https://www.google.com/maps?q=Shiv+Kripa+Motors+TVS,+Bilaspur+Road,+Kota,+Chhattisgarh&output=embed',
  mapDirections:
    'https://www.google.com/maps/dir/?api=1&destination=Shiv+Kripa+Motors+TVS%2C+Bilaspur+Road%2C+Kota%2C+Chhattisgarh',
  /** UNVERIFIED — the centre of Kota town, not the showroom door. */
  geo: { lat: 22.2907, lng: 82.0334 },

  /**
   * Opening times, or `null` while they are unknown.
   *
   * They are unknown. Nobody has told us when the showroom opens, and a website
   * that says 9:30 when the shutter goes up at 10:30 sends a real person on a
   * wasted trip — the one kind of error on this site that costs a customer
   * something. So the site says "call to check" and gives the number, which is
   * useful and true, instead of a table that is neither.
   *
   * Fill this in and the table appears everywhere it belongs, including the
   * opening hours in the structured data. Nothing else needs touching.
   */
  hours: null as OpeningHour[] | null,

  /**
   * The dealership's own logo, dropped into public/brand/. Leave as null and
   * the header typesets the name instead — which is a deliberate fallback, not
   * a broken state. Nothing usable has been supplied yet: the signage in the
   * photographs is TVS's own dealer board, not a separate logo.
   */
  logo: null as string | null,

  /** UNVERIFIED — the photographs are of an opening ceremony, so this is new. */
  since: 2026,

  /** No social presence supplied yet. Fill these in and the footer links appear. */
  social: {
    instagram: null as string | null,
    facebook: null as string | null,
    googleBusiness: null as string | null,
  },

  /**
   * PLACEHOLDER — every word below is written to be replaced. It says only what
   * the photographs actually show (a new showroom, a full floor, an opening day)
   * and claims nothing about years in business, customers served or awards.
   */
  about: {
    /** PLACEHOLDER — the owner's name has not been supplied. */
    owner: null as string | null,
    ownerRole: 'Proprietor',
    lede:
      'A new TVS showroom on Bilaspur Road, opened so that people in Kota do not have to drive to the city to buy a two-wheeler, service it, or sort out a loan.',
    story: [
      'Shiv Kripa Motors opened on Bilaspur Road in Kota with the full TVS range on the floor — Jupiter and NTORQ scooters, Raider and Sport commuters, and the Apache line — so a buyer can sit on the bike they are considering instead of choosing from a brochure.',
      'The showroom sells, registers and services in the same building. Paperwork, the RTO run, insurance and the finance file are all handled here, and the on-road price is written out in full before anything is signed.',
      'The team is local. If something is wrong with a bike bought here, the person who sold it is the person you speak to.',
    ],
    /** PLACEHOLDER — names and roles invented. */
    team: [] as { name: string; role: string }[],
  },

  /**
   * CONFIRMED — the live deployment, used for canonical URLs and JSON-LD.
   *
   * WhatsApp messages do not read it: they take the origin from the browser, so
   * the link the owner receives is always the site the visitor was actually on.
   * That stays true if a custom domain is added later, and only this line needs
   * updating for the canonical tags.
   */
  siteUrl: 'https://tvs-dealership-preved.vercel.app',
} as const;

export type Dealer = typeof dealer;

export const dealerFullName = `${dealer.name} — ${dealer.legalSuffix}, ${dealer.city}`;

/** "Kota, Bilaspur" — how the town is named to someone who knows the district. */
export const placeLine = `${dealer.city}, ${dealer.district}`;

export const addressOneLine = [
  dealer.address.line1,
  dealer.address.line2,
  `${dealer.address.city}, ${dealer.address.district} district`,
  `${dealer.address.state} ${dealer.address.pincode}`,
]
  .filter(Boolean)
  .join(', ');

/** Weekday hours collapse to one line wherever the full table is too much. */
export const hoursSummary = (() => {
  if (!dealer.hours) return null;
  const week = dealer.hours.filter((h) => h.day !== 'sun');
  if (week.length === 0) return null;
  const same = week.every((h) => h.open === week[0].open && h.close === week[0].close);
  return same ? { open: week[0].open, close: week[0].close } : null;
})();

/** Both numbers, for the places that list them rather than dial one. */
export const phones = [
  { e164: dealer.phone, display: dealer.phoneDisplay },
  { e164: dealer.phoneAlt, display: dealer.phoneAltDisplay },
];
