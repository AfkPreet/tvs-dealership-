/**
 * Every business fact on the site resolves from this file.
 * When the client sends her real details, this is the only file that changes.
 *
 * PLACEHOLDER DATA — dealer name, phone, GSTIN and address are stand-ins for the
 * sample build. Replace with the real dealership details before go-live.
 */

export type OpeningHour = {
  /** Key into copy.hours.days — never a display string. */
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  open: string | null;
  close: string | null;
};

export const dealer = {
  name: 'Shakti Motors',
  legalSuffix: 'Authorised TVS Dealer',
  city: 'Bilaspur',
  state: 'Chhattisgarh',

  address: {
    line1: 'Ground Floor, Plot 14, Vyapar Vihar Road',
    line2: 'Near Nehru Chowk',
    city: 'Bilaspur',
    state: 'Chhattisgarh',
    pincode: '495001',
  },

  /** Tehsils served — used in the location section. */
  serviceArea: ['Bilaspur', 'Bilha', 'Masturi', 'Kota', 'Takhatpur'],

  /** E.164 without the +, used for tel: and wa.me links. */
  phone: '919876543210',
  phoneDisplay: '+91 98765 43210',
  whatsapp: '919876543210',

  gstin: '22AABCS1429P1ZQ',

  /** Google Maps — embed (iframe) and the directions deep link. */
  mapEmbed:
    'https://www.google.com/maps?q=Vyapar+Vihar+Road,+Bilaspur,+Chhattisgarh+495001&output=embed',
  mapDirections:
    'https://www.google.com/maps/dir/?api=1&destination=Vyapar+Vihar+Road%2C+Bilaspur%2C+Chhattisgarh+495001',
  geo: { lat: 22.0797, lng: 82.1409 },

  hours: [
    { day: 'mon', open: '09:30', close: '20:00' },
    { day: 'tue', open: '09:30', close: '20:00' },
    { day: 'wed', open: '09:30', close: '20:00' },
    { day: 'thu', open: '09:30', close: '20:00' },
    { day: 'fri', open: '09:30', close: '20:00' },
    { day: 'sat', open: '09:30', close: '20:00' },
    { day: 'sun', open: '10:00', close: '17:00' },
  ] as OpeningHour[],

  /**
   * Web3Forms access key. The public key is safe in client code by design —
   * it only permits posting to this form's inbox.
   * Swap for the client's own key from https://web3forms.com (free tier).
   */
  formEndpoint: 'https://api.web3forms.com/submit',
  formAccessKey: 'REPLACE-WITH-WEB3FORMS-ACCESS-KEY',

  /** Public site origin, used for canonical URLs and JSON-LD. */
  siteUrl: 'https://shakti-motors-bilaspur.vercel.app',
} as const;

export type Dealer = typeof dealer;

export const dealerFullName = `${dealer.name} — ${dealer.legalSuffix}, ${dealer.city}`;

export const addressOneLine = [
  dealer.address.line1,
  dealer.address.line2,
  `${dealer.address.city}, ${dealer.address.state} ${dealer.address.pincode}`,
].join(', ');
