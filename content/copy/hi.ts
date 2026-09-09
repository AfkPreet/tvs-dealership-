import type { Copy } from './en';
import { dealer, placeLine } from '@/content/dealer';

/**
 * Hindi copy is written natively, not translated line-by-line from English.
 * Model names, "EMI", "RTO", "on-road price", "service", "showroom" and similar
 * terms stay in Latin script — that is how people in Bilaspur actually say them,
 * and transliterating them into Devanagari reads as machine-translated.
 */
export const hi: Copy = {
  meta: {
    localeTag: 'hi',
    htmlLang: 'hi-IN',
    switchLabel: 'भाषा बदलें',
  },

  nav: {
    home: 'होम',
    vehicles: 'गाड़ियाँ',
    finance: 'Finance और EMI',
    service: 'Service',
    about: 'हमारे बारे में',
    contact: 'शोरूम आइए',
    skipToContent: 'सीधे मुख्य हिस्से पर जाएँ',
    menu: 'मेन्यू',
    close: 'बंद करें',
    openMenu: 'मेन्यू खोलें',
  },

  actions: {
    bookTestRide: 'Test ride बुक करें',
    callNow: 'अभी कॉल करें',
    getOnRoadPrice: 'On-road price जानें',
    getBestPrice: 'WhatsApp पर बेस्ट रेट लें',
    whatsapp: 'WhatsApp करें',
    viewAll: 'सारे मॉडल देखें',
    viewModel: 'मॉडल देखें',
    directions: 'रास्ता देखें',
    calculateEmi: 'EMI calculator खोलें',
    submit: 'पूछताछ भेजें',
    sendAgain: 'एक और पूछताछ भेजें',
    bookSlot: 'Service slot बुक करें',
  },

  hero: {
    eyebrow: `${placeLine} में अब खुल गया`,
    headline: 'एक ही जगह, आपकी TVS तैयार।',
    sub: `${dealer.address.line2} पर sales, service और spares — तीनों एक ही छत के नीचे। पूरा on-road price खुलकर बताया जाता है, finance शोरूम में ही मंज़ूर होता है, और हर पूछताछ का जवाब WhatsApp पर मिलता है।`,
    scrollHint: 'नीचे देखें',
    proof: [
      { value: (n: number) => String(n), label: 'मॉडल फ़्लोर पर' },
      { value: () => 'पूरा', label: 'on-road दाम, खुलकर' },
      { value: () => 'WhatsApp', label: 'हर पूछताछ का जवाब' },
    ],
  },

  range: {
    heading: 'पूरी TVS रेंज, एक ही फ़्लोर पर',
    sub: 'जो कुछ हम बेचते हैं, सब यहाँ है। किसी भी मॉडल पर टैप कीजिए, पूरा on-road दाम खुल जाएगा।',
    countLabel: (n: number) => `${n} मॉडल`,
  },

  models: {
    heading: 'यहाँ से शुरू करें',
    sub: `वही मॉडल जो ${dealer.city} में सबसे ज़्यादा चलते हैं। नीचे दिए दाम ex-showroom, शुरुआती हैं।`,
    priceFrom: 'शुरू',
    exShowroom: 'ex-showroom',
    onRoadFrom: 'On-road शुरू',
  },

  emiTeaser: {
    heading: 'असली सवाल तो महीने की किस्त का है।',
    sub: 'तो पहले वही बता देते हैं। 20% down payment और 9.7% पर 36 महीने की अनुमानित EMI।',
    perMonth: '/महीना',
    cta: 'अपनी EMI खुद निकालें',
    chipLabel: 'EMI शुरू',
  },

  why: {
    heading: 'नया शोरूम। इतना पक्का है।',
    sub: 'अभी कोई रिव्यू नहीं है, इसलिए वही बता रहे हैं जो पहले दिन से सच है।',
    items: [
      {
        title: 'Authorised TVS dealer',
        body: 'TVS Motor Company से मान्यता प्राप्त। डिलीवरी वाले दिन ही warranty रजिस्टर होती है, जो पूरे भारत में किसी भी TVS workshop में चलती है।',
      },
      {
        title: '3S — एक ही छत के नीचे',
        body: 'Sales, Service और Spares एक ही बिल्डिंग में। कुछ बनवाना हो तो दूसरा पता ढूँढने की ज़रूरत नहीं।',
      },
      {
        title: 'Factory-trained मैकेनिक',
        body: 'हमारे workshop का स्टाफ TVS से ट्रेनिंग और सर्टिफिकेट लेकर आया है, बगल के गैरेज से नहीं।',
      },
      {
        title: 'सिर्फ़ genuine TVS parts',
        body: 'यहाँ लगने वाले हर पुर्ज़े पर TVS part number होता है और बिल मिलता है। नकली पुर्ज़े warranty खत्म कर देते हैं।',
      },
      {
        title: 'शोरूम में ही finance desk',
        body: 'बैंक और NBFC के लोग यहीं बैठते हैं। कागज़ साथ लाइए, ज़्यादातर मामलों में उसी दिन मंज़ूरी लेकर जाइए।',
      },
      {
        title: 'पहली free services शामिल',
        body: 'गाड़ी के साथ मिलने वाली free services यहीं होती हैं, और हर बार service book पर मुहर लगती है।',
      },
    ],
  },

  location: {
    heading: 'आकर गाड़ी देख लीजिए',
    sub: `${dealer.city} में ${dealer.address.line2} पर। नाम लेकर पूछ लीजिए — इमारत के सामने TVS का बोर्ड लगा है।`,
    addressLabel: 'पता',
    hoursUnknown: 'समय अभी यहाँ नहीं लिखा है — आने से पहले एक बार फ़ोन कर लीजिए।',
    hoursLabel: 'खुलने का समय',
    phoneLabel: 'फ़ोन',
    gstinLabel: 'GSTIN',
    serviceAreaLabel: 'डिलीवरी और registration इन इलाकों में',
    mapTitle: `${dealer.address.line2}, ${placeLine} पर शोरूम की जगह दिखाता नक्शा`,
    closed: 'बंद',
    days: {
      mon: 'सोमवार',
      tue: 'मंगलवार',
      wed: 'बुधवार',
      thu: 'गुरुवार',
      fri: 'शुक्रवार',
      sat: 'शनिवार',
      sun: 'रविवार',
    },
  },

  form: {
    heading: 'बताइए किस गाड़ी पर नज़र है',
    sub: 'सिर्फ़ तीन खाने। जवाब WhatsApp पर, आम तौर पर एक घंटे के अंदर।',
    name: 'आपका नाम',
    namePlaceholder: 'जैसे रमेश साहू',
    phone: 'मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का नंबर',
    phonePrefix: '+91',
    model: 'कौन सा मॉडल देख रहे हैं',
    modelAny: 'अभी तय नहीं किया',
    date: 'कौन सी तारीख़',
    serviceType: 'Service किस तरह की',
    vehicleModel: 'आपकी गाड़ी',
    errors: {
      name: 'कृपया अपना नाम लिखें।',
      phone: 'कृपया 10 अंकों का मोबाइल नंबर लिखें।',
      date: 'कृपया तारीख़ चुनें।',
    },
    successHeading: 'WhatsApp खुल रहा है।',
    successBody:
      'आपके लिए मैसेज तैयार है — बस भेज दीजिए, हम इसी नंबर पर जवाब देंगे। अगर WhatsApp नहीं खुला तो नीचे वाला बटन दबाइए।',
    successFallback: 'WhatsApp खोलें',
    offlineNote:
      'हर पूछताछ सीधे शोरूम के WhatsApp पर जाती है। हम email नहीं माँगते, क्योंकि उसे कोई देखता ही नहीं।',
    privacy: 'आपका नंबर सिर्फ़ इसी पूछताछ का जवाब देने के लिए इस्तेमाल होगा। और कुछ नहीं।',
  },

  vehiclesPage: {
    title: 'हमारे यहाँ मिलने वाली सारी TVS गाड़ियाँ',
    sub: 'ज़रूरत के हिसाब से छाँटिए। छाँटा हुआ लिंक WhatsApp पर भेजिए — सामने वाले को भी वैसा ही खुलेगा।',
    filterLabel: 'किस तरह की गाड़ी',
    all: 'सभी',
    count: (n: number) => `${n} मॉडल`,
    empty: 'इस श्रेणी में अभी कुछ नहीं है। हमसे पूछिए — मँगवा देंगे।',
  },

  categories: {
    scooter: 'स्कूटर',
    motorcycle: 'मोटरसाइकिल',
    moped: 'मोपेड',
    electric: 'इलेक्ट्रिक',
  },

  model: {
    backToAll: 'सारी गाड़ियाँ',
    colourLabel: 'रंग',
    colourHint: 'रंग पर टैप करके देखिए',
    coloursAvailable: 'उपलब्ध रंग',
    galleryHeading: 'और तस्वीरें',
    specsHeading: 'स्पेसिफिकेशन',
    variantsHeading: 'Variants और ex-showroom दाम',
    variantColumn: 'Variant',
    priceColumn: 'Ex-showroom',
    onRoadHeading: 'पूरा on-road दाम',
    onRoadWhy: [
      {
        term: 'Ex-showroom',
        detail: 'गाड़ी का कंपनी वाला दाम, इसमें और कुछ जुड़ा नहीं है।',
      },
      {
        term: 'RTO',
        detail: 'छत्तीसगढ़ में गाड़ी की कीमत का 4% रोड टैक्स, साथ में registration, HSRP नंबर प्लेट और स्मार्ट कार्ड।',
      },
      {
        term: 'Insurance',
        detail: 'एक साल own-damage और पाँच साल third-party — नई गाड़ी पर यही कानूनी न्यूनतम है।',
      },
      {
        term: 'ज़रूरी सामान',
        detail: 'ISI मार्क वाला हेलमेट, मडफ़्लैप और फ़िटिंग। असल में यह छोड़ा नहीं जाता, इसलिए छिपाया भी नहीं।',
      },
    ],
    onRoadSub: 'बेस variant पर निकाला गया। नीचे हर लाइन असली खर्च है, कोई छिपा हुआ नहीं।',
    onRoadRows: {
      exShowroom: 'Ex-showroom दाम',
      rto: 'RTO — road tax, registration, HSRP',
      insurance: 'Insurance — 1 साल OD + 5 साल third party',
      accessories: 'ज़रूरी सामान — ISI हेलमेट, मडफ्लैप, फिटिंग',
      total: `On-road price, ${dealer.city}`,
    },
    onRoadNote:
      'यह अनुमानित है। छत्तीसगढ़ में road tax गाड़ी की कीमत का 4% लगता है; insurance कंपनी और उम्र के हिसाब से बदलता है। Finance पर लेने पर ₹1,500 hypothecation चार्ज अलग से लगता है। आख़िरी रकम शोरूम में पक्की कर लीजिए।',
    emiStrip: (emi: string, months: number) => `${emi}/महीना, ${months} महीने तक`,
    emiStripNote: '20% down payment और 9.7% पर अनुमानित।',
    ctaHeading: 'आगे बढ़ने के दो रास्ते',
    ctaSub: 'Test ride बुक करके खुद चलाकर देखिए, या WhatsApp पर लिखित में सबसे अच्छा रेट ले लीजिए।',
    sourcesHeading: 'ये आँकड़े कहाँ से हैं',
    sourcesNote:
      'स्पेसिफिकेशन और दाम नीचे दी तारीख़ को देखे गए थे। कंपनी बिना बताए दाम बदलती है — मौजूदा रेट हम शोरूम में पक्का कर देते हैं।',
    specLabels: {
      engine: 'इंजन',
      battery: 'बैटरी',
      power: 'ज़्यादा से ज़्यादा पावर',
      torque: 'ज़्यादा से ज़्यादा टॉर्क',
      cooling: 'कूलिंग',
      transmission: 'गियर',
      mileage: 'माइलेज (दावा)',
      range: 'रेंज (दावा)',
      kerbWeight: 'वज़न',
      fuelTank: 'पेट्रोल टंकी',
      chargeTime: 'चार्जिंग टाइम',
      seatHeight: 'सीट की ऊँचाई',
      wheelbase: 'व्हीलबेस',
      groundClearance: 'ग्राउंड क्लीयरेंस',
      brakes: 'ब्रेक',
      suspension: 'सस्पेंशन',
      colours: 'उपलब्ध रंग',
    },
    specValues: {
      air: 'Air cooled',
      airOil: 'Air और oil cooled',
      liquid: 'Liquid cooled',
      none: '—',
      cvt: 'CVT ऑटोमैटिक',
      gear5: '5 गियर',
      gear6: '6 गियर',
      gear4: '4 गियर',
      automatic: 'ऑटोमैटिक',
      disc: 'Disc',
      drum: 'Drum',
      abs: 'ABS के साथ',
      cbs: 'CBS के साथ',
      telescopic: 'आगे telescopic फोर्क',
      usd: 'आगे upside-down फोर्क',
      monoshock: 'पीछे मोनोशॉक',
      gasCharged: 'पीछे gas-charged मोनोशॉक',
      twinShock: 'पीछे दो हाइड्रोलिक शॉकर',
      coilSpring: 'पीछे कॉइल स्प्रिंग',
      front: 'आगे',
      rear: 'पीछे',
    },
  },

  finance: {
    title: 'महीने की किस्त खुद निकाल लीजिए',
    sub: 'यह वही reducing-balance फॉर्मूला है जो हर बैंक लगाता है। कोई भी नंबर बदलिए, जवाब साथ-साथ बदलेगा।',
    calcHeading: 'EMI calculator',
    price: 'गाड़ी की कीमत (on-road)',
    downPayment: 'Down payment',
    tenure: 'कितने महीने',
    months: 'महीने',
    rate: 'ब्याज दर',
    perAnnum: 'सालाना',
    loanAmount: 'लोन की रकम',
    emi: 'महीने की EMI',
    totalInterest: 'कुल ब्याज',
    totalPayable: 'कुल भुगतान',
    downPaymentPercent: (p: number) => `गाड़ी की कीमत का ${p}%`,
    disclaimer:
      'यह सिर्फ़ अनुमान है। न यह ऑफ़र है, न कोटेशन, न मंज़ूरी। आपकी असली EMI बैंक, आपके credit record और उस दिन मिलने वाली दर पर निर्भर करती है। ऊपर processing fee और hypothecation चार्ज शामिल नहीं हैं।',
    tradeoffHeading: 'लंबी अवधि, छोटी किस्त, ज़्यादा ब्याज',
    tradeoffBody:
      'लोन 24 महीने से बढ़ाकर 48 महीने कर दें तो महीने की किस्त लगभग आधी रह जाती है — और कुल ब्याज लगभग दोगुना हो जाता है। ज़्यादा down payment इसका उल्टा करता है: आज ज़्यादा, कुल मिलाकर कम। दोनों में कोई गलत नहीं है। वही चुनिए जो हर महीने बिना तंगी के भरा जा सके।',
    tradeoffExample: 'ऊपर आज़माइए: पहले 24 महीने रखिए, फिर 48 — और कुल ब्याज वाली लाइन देखिए।',
    docsHeading: 'Finance desk पर क्या-क्या लाना है',
    docsSub: 'ये साथ ले आइए तो एक ही चक्कर में काम हो जाता है। फोटोकॉपी के साथ ओरिजिनल भी दिखाने के लिए।',
    docs: [
      { title: 'पहचान पत्र', body: 'आधार, PAN कार्ड या ड्राइविंग लाइसेंस। ₹50,000 से ऊपर के लोन पर PAN ज़रूरी है।' },
      { title: 'पते का सबूत', body: 'आधार, बिजली का बिल, राशन कार्ड या अपने नाम का किरायानामा।' },
      { title: 'पासपोर्ट फोटो', body: 'तीन हाल की पासपोर्ट साइज़ फोटो।' },
      { title: 'बैंक स्टेटमेंट', body: 'पिछले 6 महीने का, बैंक की मुहर वाला या बैंक लोगो के साथ PDF।' },
      { title: 'आमदनी का सबूत', body: 'पिछले 3 महीने की सैलरी स्लिप, या अपना काम हो तो पिछले साल की ITR।' },
      { title: 'कैंसल चेक', body: 'उसी खाते का जिससे EMI कटेगी, NACH mandate के लिए।' },
    ],
    formHeading: 'सीधे finance desk से पूछिए',
    formSub: 'मॉडल बता दीजिए, हम आपके लिए down payment और EMI के विकल्प निकालकर बताएँगे।',
  },

  service: {
    title: 'Service slot बुक कीजिए',
    sub: 'दिन चुन लीजिए, हम बे खाली रख देंगे। Free service, paid service और रिपेयर — तीनों यहीं से बुक होते हैं।',
    warrantyHeading: 'Service कहाँ कराते हैं, इससे फ़र्क पड़ता है',
    warrantyBody:
      'Authorised TVS workshop में service कराने से गाड़ी की warranty चलती रहती है, हर बार service book पर मुहर लगती है, और सिर्फ़ genuine TVS parts लगते हैं। Warranty claim सबसे ज़्यादा इसी वजह से रद्द होता है कि कोई service छूट गई या दर्ज नहीं हुई।',
    typeLabel: 'Service किस तरह की',
    types: {
      free: 'Free service (शेड्यूल के अंदर)',
      paid: 'Paid periodic service',
      repair: 'रिपेयर या ब्रेकडाउन',
    },
    slotNote: 'बुकिंग भेज दीजिए, हम WhatsApp पर समय बता देंगे। उसी दिन का slot इस पर निर्भर है कि वर्कशॉप में कितनी भीड़ है।',
  },

  about: {
    title: 'शोरूम',
    lede: 'हम कौन हैं, और अंदर आने पर आपको क्या मिलेगा।',
    storyHeading: 'शुरुआत कैसे हुई',
    galleryHeading: 'उद्घाटन का दिन',
    galleryBody: 'शोरूम खुला तो फ़्लोर पूरा भरा हुआ था और दरवाज़े पर आधा कोटा खड़ा था।',
    teamHeading: 'यहाँ के लोग',
    visitHeading: 'आकर देखिए',
    visitBody:
      'फ़्लोर पर गाड़ियाँ हर हफ़्ते बदलती रहती हैं। कोई ख़ास मॉडल और रंग देखना है तो आने से पहले फ़ोन कर लीजिए, हम निकालकर रख देंगे।',
    sinceLabel: 'TVS बेच रहे हैं',
    photoCredit: 'तस्वीरें शोरूम की हैं।',
  },

  footer: {
    tagline: `Authorised TVS Dealer, ${placeLine}`,
    navHeading: 'पेज',
    contactHeading: 'संपर्क',
    hoursHeading: 'खुला',
    legal: 'इस साइट के सारे दाम और स्पेसिफिकेशन अनुमानित हैं और बदल सकते हैं। TVS, TVS का लोगो और सभी मॉडल नाम TVS Motor Company Limited के ट्रेडमार्क हैं।',
    rights: (year: number, name: string) => `© ${year} ${name}. सर्वाधिकार सुरक्षित।`,
  },

  a11y: {
    floatingWhatsapp: 'WhatsApp पर पूछें',
    floatingCall: 'शोरूम को कॉल करें',
    progressRail: 'पेज के हिस्से',
    langEn: 'अंग्रेज़ी',
    langHi: 'हिंदी',
  },
};
