export const en = {
  meta: {
    localeTag: 'en',
    htmlLang: 'en-IN',
    switchLabel: 'Change language',
  },

  nav: {
    home: 'Home',
    vehicles: 'Vehicles',
    finance: 'Finance & EMI',
    service: 'Service',
    contact: 'Visit us',
    skipToContent: 'Skip to main content',
    menu: 'Menu',
    close: 'Close',
    openMenu: 'Open navigation menu',
  },

  preview: {
    ribbon: 'PREVIEW',
    line: 'Sample build. Vehicle imagery and brand assets to be supplied from the official TVS dealer brand pack.',
  },

  actions: {
    bookTestRide: 'Book a test ride',
    callNow: 'Call now',
    getOnRoadPrice: 'Get on-road price',
    getBestPrice: 'Get best price on WhatsApp',
    whatsapp: 'WhatsApp us',
    viewAll: 'See all models',
    viewModel: 'View model',
    directions: 'Get directions',
    calculateEmi: 'Open EMI calculator',
    submit: 'Send enquiry',
    sending: 'Sending…',
    sendAgain: 'Send another enquiry',
    bookSlot: 'Book service slot',
  },

  hero: {
    eyebrow: 'Now open in Bilaspur',
    headline: 'Your TVS, sorted in one visit.',
    sub: 'Sales, service and spares under one roof on Vyapar Vihar Road. On-road prices quoted in full, finance approved in the showroom, and every enquiry answered on WhatsApp.',
    scrollHint: 'Scroll',
  },

  models: {
    heading: 'Start with these',
    sub: 'The models Bilaspur actually rides. Prices shown are ex-showroom, from.',
    priceFrom: 'From',
    exShowroom: 'ex-showroom',
    onRoadFrom: 'On-road from',
  },

  emiTeaser: {
    heading: 'The real question is the monthly figure.',
    sub: 'So here it is, before you ask. Indicative EMI at 9.7% for 36 months with 20% down payment.',
    perMonth: '/month',
    cta: 'Work out your own EMI',
    chipLabel: 'EMI from',
  },

  why: {
    heading: 'We opened last month. Here is what that gets you.',
    sub: 'No reviews yet — so instead, the things that are true on day one.',
    items: [
      {
        title: 'Authorised TVS dealer',
        body: 'Appointed by TVS Motor Company. Warranty registered on the day of delivery, honoured at any TVS workshop in India.',
      },
      {
        title: '3S under one roof',
        body: 'Sales, Service and Spares in the same building. You do not chase a second address when something needs fixing.',
      },
      {
        title: 'Factory-trained technicians',
        body: 'Our workshop staff are trained and certified by TVS, not picked up from the roadside garage next door.',
      },
      {
        title: 'Genuine TVS parts only',
        body: 'Every part fitted here carries a TVS part number and a bill. Counterfeit parts void your warranty.',
      },
      {
        title: 'Finance desk in the showroom',
        body: 'Bank and NBFC representatives sit here. Bring your documents and walk out with an approval the same day in most cases.',
      },
      {
        title: 'Free first services included',
        body: 'The scheduled free services that come with your vehicle are done here, with the service book stamped each time.',
      },
    ],
  },

  location: {
    heading: 'Come and see the vehicles',
    sub: 'Vyapar Vihar Road, five minutes from Nehru Chowk. Parking in front.',
    addressLabel: 'Address',
    hoursLabel: 'Opening hours',
    phoneLabel: 'Phone',
    gstinLabel: 'GSTIN',
    serviceAreaLabel: 'We deliver and register across',
    mapTitle: 'Map showing the showroom location on Vyapar Vihar Road, Bilaspur',
    closed: 'Closed',
    days: {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday',
    },
  },

  form: {
    heading: 'Tell us what you are looking at',
    sub: 'Three fields. We reply on WhatsApp, usually within the hour.',
    name: 'Your name',
    namePlaceholder: 'e.g. Ramesh Sahu',
    phone: 'Mobile number',
    phonePlaceholder: '10-digit number',
    phonePrefix: '+91',
    model: 'Model you are interested in',
    modelAny: 'Not decided yet',
    date: 'Preferred date',
    serviceType: 'Type of service',
    vehicleModel: 'Your vehicle',
    errors: {
      name: 'Please enter your name.',
      phone: 'Please enter a 10-digit Indian mobile number.',
      date: 'Please pick a date.',
    },
    successHeading: 'Sent. WhatsApp is opening now.',
    successBody:
      'If WhatsApp did not open, tap the button below — your enquiry is already saved with us either way.',
    successFallback: 'Open WhatsApp',
    offlineNote:
      'Your enquiry is recorded and sent to the showroom WhatsApp. We do not ask for an email address, because nobody checks it.',
    privacy: 'We use your number to reply to this enquiry. Nothing else.',
  },

  vehiclesPage: {
    title: 'Every TVS model we sell',
    sub: 'Filter by what you need. Share the filtered link on WhatsApp — it opens exactly as you left it.',
    filterLabel: 'Filter by type',
    all: 'All',
    count: (n: number) => `${n} ${n === 1 ? 'model' : 'models'}`,
    empty: 'Nothing in this category yet. Ask us — we can source it.',
  },

  categories: {
    scooter: 'Scooters',
    motorcycle: 'Motorcycles',
    moped: 'Mopeds',
    electric: 'Electric',
  },

  model: {
    backToAll: 'All vehicles',
    colourLabel: 'Colour',
    spinnerHint: 'Drag to rotate',
    spinnerHintTouch: 'Swipe to rotate',
    spinnerLoading: 'Loading views',
    spinnerAlt: (name: string, colour: string, deg: number) =>
      `${name} in ${colour}, rotated ${deg} degrees`,
    specsHeading: 'Specifications',
    variantsHeading: 'Variants and ex-showroom prices',
    variantColumn: 'Variant',
    priceColumn: 'Ex-showroom',
    onRoadHeading: 'On-road price, in full',
    onRoadSub: 'Calculated on the base variant. Every line below is a real cost, not a hidden one.',
    onRoadRows: {
      exShowroom: 'Ex-showroom price',
      rto: 'RTO — road tax, registration, HSRP',
      insurance: 'Insurance — 1 year OD + 5 year third party',
      accessories: 'Essential kit — ISI helmet, mudflap, fitting',
      total: 'On-road price, Bilaspur',
    },
    onRoadNote:
      'Indicative. Road tax is charged at 4% of vehicle cost in Chhattisgarh; insurance varies by insurer and by rider age. Hypothecation charges of ₹1,500 apply on financed purchases. Confirm the final figure at the showroom.',
    emiStrip: (emi: string, months: number) => `${emi}/month for ${months} months`,
    emiStripNote: 'Indicative, at 9.7% with 20% down payment.',
    ctaHeading: 'Two ways to take this further',
    ctaSub: 'Book a test ride and ride it yourself, or get the sharpest price we can do — on WhatsApp, in writing.',
    sourcesHeading: 'Where these figures come from',
    sourcesNote:
      'Specifications and prices read on the date shown. Manufacturer prices change without notice — we confirm the current figure at the showroom.',
    specLabels: {
      engine: 'Engine',
      battery: 'Battery',
      power: 'Max power',
      torque: 'Max torque',
      cooling: 'Cooling',
      transmission: 'Transmission',
      mileage: 'Mileage (claimed)',
      range: 'Range (claimed)',
      kerbWeight: 'Kerb weight',
      fuelTank: 'Fuel tank',
      chargeTime: 'Charging time',
      seatHeight: 'Seat height',
      wheelbase: 'Wheelbase',
      groundClearance: 'Ground clearance',
      brakes: 'Brakes',
      suspension: 'Suspension',
      colours: 'Colours available',
    },
    specValues: {
      air: 'Air cooled',
      airOil: 'Air and oil cooled',
      liquid: 'Liquid cooled',
      none: '—',
      cvt: 'CVT automatic',
      gear5: '5-speed',
      gear4: '4-speed',
      automatic: 'Automatic',
      disc: 'Disc',
      drum: 'Drum',
      abs: 'with ABS',
      cbs: 'with CBS',
      telescopic: 'Telescopic front fork',
      usd: 'Upside-down front fork',
      monoshock: 'Monoshock rear',
      gasCharged: 'Gas-charged monoshock rear',
      twinShock: 'Twin hydraulic shocks rear',
      coilSpring: 'Coil spring rear',
      front: 'Front',
      rear: 'Rear',
    },
  },

  finance: {
    title: 'Work out the monthly figure yourself',
    sub: 'This is the same reducing-balance formula every bank uses. Change any number and the answer moves as you type.',
    calcHeading: 'EMI calculator',
    price: 'Vehicle price (on-road)',
    downPayment: 'Down payment',
    tenure: 'Tenure',
    months: 'months',
    rate: 'Interest rate',
    perAnnum: 'per year',
    loanAmount: 'Loan amount',
    emi: 'Monthly EMI',
    totalInterest: 'Total interest',
    totalPayable: 'Total payable',
    downPaymentPercent: (p: number) => `${p}% of vehicle price`,
    disclaimer:
      'Indicative only. This is not an offer, a quote or an approval. Your actual EMI depends on the lender, your credit history and the rate offered to you on the day. Processing fees and hypothecation charges are not included above.',
    tradeoffHeading: 'Longer tenure, smaller EMI, more interest',
    tradeoffBody:
      'Stretching the loan from 24 months to 48 months can cut the monthly figure by nearly half — and roughly doubles what you pay in interest overall. A larger down payment does the opposite: it costs more today and less in total. Neither is wrong. Pick the one that fits what you can pay every month without strain.',
    tradeoffExample: 'Try it above: set 24 months, then 48, and watch the total interest line.',
    docsHeading: 'What to bring to the finance desk',
    docsSub: 'Bring these and approval usually takes a single visit. Photocopies plus originals for verification.',
    docs: [
      { title: 'Photo ID', body: 'Aadhaar card, PAN card, or driving licence. PAN is needed for loans above ₹50,000.' },
      { title: 'Address proof', body: 'Aadhaar, electricity bill, ration card or rent agreement in your name.' },
      { title: 'Passport photos', body: 'Three recent passport-size photographs.' },
      { title: 'Bank statement', body: 'Last 6 months, stamped by the bank or downloaded as a PDF with the bank logo.' },
      { title: 'Income proof', body: 'Salary slips for the last 3 months, or ITR for the last year if self-employed.' },
      { title: 'Cancelled cheque', body: 'From the account the EMI will be debited from, for the NACH mandate.' },
    ],
    formHeading: 'Ask the finance desk directly',
    formSub: 'Tell us the model and we will come back with the down payment and EMI options available to you.',
  },

  service: {
    title: 'Book a service slot',
    sub: 'Pick a day and we will keep a bay free. Free services, paid services and repairs all booked here.',
    warrantyHeading: 'Why it matters where you service it',
    warrantyBody:
      'Servicing at an authorised TVS workshop keeps your vehicle warranty valid, gets each visit stamped in your service book, and means only genuine TVS parts go on. A missed or unrecorded service is the most common reason a warranty claim gets rejected.',
    typeLabel: 'Type of service',
    types: {
      free: 'Free service (within schedule)',
      paid: 'Paid periodic service',
      repair: 'Repair or breakdown',
    },
    slotNote: 'We are closed on no day of the week — but Sunday runs shorter hours. Same-day slots depend on load.',
  },

  footer: {
    tagline: 'Authorised TVS Dealer, Bilaspur',
    navHeading: 'Pages',
    contactHeading: 'Reach us',
    hoursHeading: 'Open',
    legal: 'All prices and specifications on this site are indicative and subject to change. TVS, the TVS logo and all model names are trademarks of TVS Motor Company Limited.',
    rights: (year: number) => `© ${year} Shakti Motors. All rights reserved.`,
    builtBy: 'Sample build for client review.',
  },

  a11y: {
    floatingWhatsapp: 'Enquire on WhatsApp',
    floatingCall: 'Call the showroom',
    progressRail: 'Page sections',
    langEn: 'English',
    langHi: 'Hindi',
  },
};

/**
 * The shape every locale must satisfy. `hi.ts` is typed as `Copy`, so a missing
 * or misspelled key is a build error rather than a blank space on the page.
 */
export type Copy = typeof en;
