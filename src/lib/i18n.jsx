import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STR = {
  en: {
    nav: { vision: 'Vision', plan: 'Master Plan', amenities: 'Amenities', gallery: 'Gallery', location: 'Location', enquire: 'Enquire', menu: 'Menu', close: 'Close' },
    hero: {
      eyebrow: 'Phase 02 · Sipur Village, Padra, Vadodara',
      l1: 'Open plots,', l2: 'beautifully planned.',
      sub: 'Radhe Krishna Residency Phase 02 — open plots from ₹2.41 lakh in Sipur Village, Padra, Vadodara.',
      cta1: 'Enquire on WhatsApp', cta2: 'Explore the 3D model', scroll: 'Scroll',
      soundOff: 'Sound off', soundOn: 'Sound on', silent: 'Silent film', silentHint: 'This film has no soundtrack',
    },
    vision: {
      eyebrow: 'The vision', title: 'Room to build the life you imagine.',
      p1t: 'Space', p1: 'A 40 ft cross-over road and 25 ft internal roads give the layout breathing room from the very first step in.',
      p2t: 'Planning', p2: 'Plots sit in defined blocks, with two common plots set aside — 5,990 sq ft and 7,658 sq ft — as shared open space.',
      p3t: 'Everyday infrastructure', p3: 'Street lights, RCC roads, a water line and a light transformer (DP) are part of the layout.',
    },
    stats: { eyebrow: 'At a glance', price: 'Starting price', priceUnit: 'lakh', cross: 'Cross-over road', crossUnit: 'ft wide', road: 'Internal roads', roadUnit: 'ft wide', common: 'Common plots', commonUnit: 'open areas', amen: 'Documented amenities', amenUnit: 'in the brochure' },
    plan: {
      eyebrow: 'Interactive master plan', title: 'Walk the site in three dimensions.',
      lead: 'A miniature model of the layout, built from the brochure plan. Drag to rotate, scroll or pinch to zoom, tap a plot to inspect it.',
      notice: 'Illustrative 3D visualization built from the brochure plan drawing. Not a survey-accurate site plan, and the brochure plan is not to scale. Plot numbers, dimensions and availability are shown only where verified — confirm all details with the sales team.',
      reset: 'Reset view', tour: 'Guided tour', stopTour: 'Stop tour', rotate: 'Auto-rotate', model3d: '3D model', brochure: 'Brochure plan',
      zones: { all: 'Overview', north: 'North row', west: 'West block', east: 'East block', south: 'South row', commons: 'Common plots' },
      plot: 'Plot', commonPlot: 'Common plot', zone: 'Location in layout', number: 'Plot number', area: 'Area', dims: 'Dimensions', status: 'Availability',
      pending: 'Pending verification', notConnected: 'Not connected to live data', sqft: 'sq ft', modelRef: 'Model reference', modelEstimateNote: 'Approximate figures calculated from the illustrative 3D footprint, not official plot measurements. Confirm exact area and dimensions with the approved plan.', back: 'Back to overview', enquirePlot: 'Enquire about this plot',
      hint: 'Drag · Scroll · Tap a plot', loading: 'Preparing the 3D model…', noWebgl: 'Your device can’t display the 3D model, so the brochure plan is shown instead.',
      error: 'The 3D model could not be loaded. The brochure plan is shown instead.', legend: 'Illustrative', trees: 'Trees, street lights and landscaping are conceptual.',
      north: 'N', tourSteps: ['The full layout', 'North row of plots', 'West block', 'East block and common plot', 'South row of plots'],
    },
    amen: {
      eyebrow: 'Amenities', title: 'The essentials, planned in.', note: 'As documented in the project brochure.',
      items: [['Street lights', 'Lit internal roads'], ['Garden', 'Landscaped open space'], ['Light transformer (DP)', 'Dedicated power infrastructure'], ['RCC road', 'Concrete internal roads'], ['Water line', 'Piped water supply'], ['Attractive main gate', 'A defined entrance']],
    },
    gallery: {
      eyebrow: 'Gallery', title: 'The site, as it stands today.', note: 'Photographs of the project site.', of: 'of', prev: 'Previous image', next: 'Next image', open: 'View full screen', close: 'Close', zoom: 'Zoom', drag: 'Drag', view: 'View',
      caps: ['Internal road with kerb edging', 'Boundary fencing along the plots', 'Road and project flags', 'Road view with entrance flags', 'Kerbed road towards the site', 'Road, flags and fencing'],
    },
    loc: {
      eyebrow: 'Location', title: 'Sipur Village, Padra, Vadodara.', lead: 'Regional context for the Vadodara – Padra – Dabhoi area. For the exact project location use the verified map link.',
      open: 'Open exact location in Google Maps', ctx: 'Map shows the wider region — no project pin is drawn until verified coordinates are added.', places: ['Sipur Village', 'Padra', 'Vadodara'],
      brochure: 'Download brochure',
    },
    cta: { eyebrow: 'Enquire', title: 'Visit the site. Choose your plot.', sub: 'Open plots from ₹2.41 lakh. Message us on WhatsApp and the sales team will respond.', call: 'Call' },
    form: {
      title: 'Enquire on WhatsApp', sub: 'Send us your details and we’ll continue the conversation on WhatsApp.', name: 'Your name', phone: 'Phone number', msg: 'Message (optional)',
      send: 'Open WhatsApp', sending: 'Opening WhatsApp…', sent: 'WhatsApp opened', eName: 'Please enter your name', ePhone: 'Enter a valid 10-digit phone number', close: 'Close',
      prefix: 'Hello, I’m interested in Radhe Krishna Residency Phase 02.', plotLine: 'Area of interest',
    },
    foot: { rights: 'Radhe Krishna Residency Phase 02', arch: 'Architect: Royal Architects', top: 'Back to top', lang: 'Language' },
    cursor: { explore: 'Explore', drag: 'Drag', view: 'View', plot: 'Inspect' },
  },
  gu: {
    nav: { vision: 'વિઝન', plan: 'માસ્ટર પ્લાન', amenities: 'સુવિધાઓ', gallery: 'ગેલેરી', location: 'લોકેશન', enquire: 'પૂછપરછ', menu: 'મેનુ', close: 'બંધ કરો' },
    hero: {
      eyebrow: 'ફેઝ-૨ · સિપુર ગામ, પાદરા, વડોદરા',
      l1: 'ઓપન પ્લોટ્સનું', l2: 'સુંદર આયોજન.',
      sub: 'રાધે કૃષ્ણા રેસીડેન્સી ફેઝ-૨ — સિપુર ગામ, પાદરા, વડોદરામાં ઓપન પ્લોટ્સ ₹૨.૪૧ લાખથી શરૂ.',
      cta1: 'વોટ્સએપ પર પૂછપરછ', cta2: '3D મોડેલ જુઓ', scroll: 'સ્ક્રોલ',
      soundOff: 'અવાજ બંધ', soundOn: 'અવાજ ચાલુ', silent: 'મૌન ફિલ્મ', silentHint: 'આ ફિલ્મમાં અવાજ નથી',
    },
    vision: {
      eyebrow: 'વિઝન', title: 'તમારા સપનાનું ઘર બાંધવા માટે પૂરતી જગ્યા.',
      p1t: 'જગ્યા', p1: '૪૦ ફૂટનો ક્રોસ-ઓવર રોડ અને ૨૫ ફૂટના આંતરિક રસ્તાઓ લેઆઉટને શરૂઆતથી જ ખુલ્લાપણું આપે છે.',
      p2t: 'આયોજન', p2: 'પ્લોટ્સ નિશ્ચિત બ્લોકમાં ગોઠવાયેલા છે, અને ૫,૯૯૦ ચો.ફૂટ તથા ૭,૬૫૮ ચો.ફૂટના બે કોમન પ્લોટ ખુલ્લી જગ્યા તરીકે રાખેલા છે.',
      p3t: 'રોજિંદી સુવિધાઓ', p3: 'સ્ટ્રીટ લાઈટ, આર.સી.સી. રોડ, પાણીની લાઈન અને લાઈટ ટ્રાન્સફર (ડી.પી.) લેઆઉટનો ભાગ છે.',
    },
    stats: { eyebrow: 'એક નજરમાં', price: 'શરૂઆતની કિંમત', priceUnit: 'લાખ', cross: 'ક્રોસ-ઓવર રોડ', crossUnit: 'ફૂટ પહોળો', road: 'આંતરિક રસ્તાઓ', roadUnit: 'ફૂટ પહોળા', common: 'કોમન પ્લોટ', commonUnit: 'ખુલ્લી જગ્યા', amen: 'બ્રોશરમાં દર્શાવેલ સુવિધાઓ', amenUnit: 'સુવિધાઓ' },
    plan: {
      eyebrow: 'ઇન્ટરેક્ટિવ માસ્ટર પ્લાન', title: 'સાઇટને ત્રણ પરિમાણમાં જુઓ.',
      lead: 'બ્રોશર પ્લાન પરથી બનાવેલું લેઆઉટનું લઘુ મોડેલ. ફેરવવા માટે ખેંચો, ઝૂમ કરવા સ્ક્રોલ અથવા પિંચ કરો, અને પ્લોટ પર ટેપ કરો.',
      notice: 'બ્રોશર પ્લાન ડ્રોઇંગ પરથી બનાવેલું માત્ર દર્શાવવા માટેનું 3D વિઝ્યુલાઇઝેશન. આ સર્વે મુજબનો સાઇટ પ્લાન નથી, અને બ્રોશર પ્લાન માપ પ્રમાણે નથી. પ્લોટ નંબર, માપ અને ઉપલબ્ધતા ચકાસાયેલ હોય ત્યારે જ દર્શાવાય છે — બધી વિગતો સેલ્સ ટીમ પાસેથી ખાતરી કરો.',
      reset: 'વ્યુ રીસેટ', tour: 'માર્ગદર્શિત ટૂર', stopTour: 'ટૂર બંધ કરો', rotate: 'ઓટો-રોટેટ', model3d: '3D મોડેલ', brochure: 'બ્રોશર પ્લાન',
      zones: { all: 'સમગ્ર લેઆઉટ', north: 'ઉત્તર હરોળ', west: 'પશ્ચિમ બ્લોક', east: 'પૂર્વ બ્લોક', south: 'દક્ષિણ હરોળ', commons: 'કોમન પ્લોટ' },
      plot: 'પ્લોટ', commonPlot: 'કોમન પ્લોટ', zone: 'લેઆઉટમાં સ્થાન', number: 'પ્લોટ નંબર', area: 'ક્ષેત્રફળ', dims: 'માપ', status: 'ઉપલબ્ધતા',
      pending: 'ચકાસણી બાકી', notConnected: 'લાઇવ ડેટા સાથે જોડાયેલ નથી', sqft: 'ચો.ફૂટ', modelRef: 'મોડેલ સંદર્ભ', modelEstimateNote: 'આ અંદાજિત આંકડા દર્શનાત્મક 3D આકાર પરથી ગણેલા છે, સત્તાવાર પ્લોટ માપ નથી. ચોક્કસ ક્ષેત્રફળ અને માપ મંજૂર નકશા પરથી ચકાસો.', back: 'સમગ્ર લેઆઉટ પર પાછા', enquirePlot: 'આ પ્લોટ વિશે પૂછપરછ',
      hint: 'ખેંચો · સ્ક્રોલ · પ્લોટ પર ટેપ', loading: '3D મોડેલ તૈયાર થઈ રહ્યું છે…', noWebgl: 'તમારું ડિવાઇસ 3D મોડેલ બતાવી શકતું નથી, તેથી બ્રોશર પ્લાન બતાવ્યો છે.',
      error: '3D મોડેલ લોડ થઈ શક્યું નથી. બ્રોશર પ્લાન બતાવ્યો છે.', legend: 'દર્શાવવા માટે', trees: 'વૃક્ષો, સ્ટ્રીટ લાઈટ અને લેન્ડસ્કેપિંગ કાલ્પનિક છે.',
      north: 'ઉ', tourSteps: ['સમગ્ર લેઆઉટ', 'ઉત્તર તરફના પ્લોટ્સ', 'પશ્ચિમ બ્લોક', 'પૂર્વ બ્લોક અને કોમન પ્લોટ', 'દક્ષિણ તરફના પ્લોટ્સ'],
    },
    amen: {
      eyebrow: 'સુવિધાઓ', title: 'જરૂરી સુવિધાઓ, આયોજન સાથે.', note: 'પ્રોજેક્ટ બ્રોશરમાં દર્શાવ્યા મુજબ.',
      items: [['સ્ટ્રીટ લાઈટ', 'પ્રકાશિત આંતરિક રસ્તાઓ'], ['ગાર્ડન', 'લેન્ડસ્કેપ કરેલી ખુલ્લી જગ્યા'], ['લાઈટ ટ્રાન્સફર (ડી.પી.)', 'વીજળીની સુવિધા'], ['આર.સી.સી. રોડ', 'કોંક્રિટના આંતરિક રસ્તાઓ'], ['પાણીની લાઈન', 'પાઈપ દ્વારા પાણી'], ['આકર્ષક મેઈન ગેટ', 'નિશ્ચિત પ્રવેશદ્વાર']],
    },
    gallery: {
      eyebrow: 'ગેલેરી', title: 'સાઇટ આજે જેવી છે.', note: 'પ્રોજેક્ટ સાઇટના ફોટોગ્રાફ.', of: '/', prev: 'પાછલી તસવીર', next: 'આગલી તસવીર', open: 'પૂર્ણ સ્ક્રીન', close: 'બંધ કરો', zoom: 'ઝૂમ', drag: 'ખેંચો', view: 'જુઓ',
      caps: ['કર્બ સાથેનો આંતરિક રસ્તો', 'પ્લોટ્સ ફરતે ફેન્સિંગ', 'રસ્તો અને પ્રોજેક્ટના ફ્લેગ', 'પ્રવેશ ફ્લેગ સાથે રસ્તાનું દૃશ્ય', 'સાઇટ તરફનો કર્બવાળો રસ્તો', 'રસ્તો, ફ્લેગ અને ફેન્સિંગ'],
    },
    loc: {
      eyebrow: 'લોકેશન', title: 'સિપુર ગામ, પાદરા, વડોદરા.', lead: 'વડોદરા – પાદરા – ડભોઈ વિસ્તારનો નકશો. પ્રોજેક્ટનું ચોક્કસ સ્થાન જોવા ચકાસાયેલ મેપ લિંક વાપરો.',
      open: 'ગૂગલ મેપ્સમાં ચોક્કસ સ્થાન ખોલો', ctx: 'નકશો વિસ્તારનો સામાન્ય દેખાવ બતાવે છે — ચકાસાયેલ કોઓર્ડિનેટ ઉમેરાય ત્યાં સુધી પ્રોજેક્ટ પિન બતાવાતો નથી.', places: ['સિપુર ગામ', 'પાદરા', 'વડોદરા'],
      brochure: 'બ્રોશર ડાઉનલોડ કરો',
    },
    cta: { eyebrow: 'પૂછપરછ', title: 'સાઇટની મુલાકાત લો. તમારો પ્લોટ પસંદ કરો.', sub: 'ઓપન પ્લોટ્સ ₹૨.૪૧ લાખથી શરૂ. વોટ્સએપ પર સંદેશ કરો, સેલ્સ ટીમ જવાબ આપશે.', call: 'કૉલ કરો' },
    form: {
      title: 'વોટ્સએપ પર પૂછપરછ', sub: 'તમારી વિગતો મોકલો, વાતચીત વોટ્સએપ પર આગળ વધશે.', name: 'તમારું નામ', phone: 'ફોન નંબર', msg: 'સંદેશ (વૈકલ્પિક)',
      send: 'વોટ્સએપ ખોલો', sending: 'વોટ્સએપ ખૂલી રહ્યું છે…', sent: 'વોટ્સએપ ખુલ્યું', eName: 'કૃપા કરીને તમારું નામ લખો', ePhone: 'માન્ય ૧૦ અંકનો ફોન નંબર લખો', close: 'બંધ કરો',
      prefix: 'નમસ્તે, મને Radhe Krishna Residency Phase 02 માં રસ છે.', plotLine: 'રસનો વિસ્તાર',
    },
    foot: { rights: 'રાધે કૃષ્ણા રેસીડેન્સી ફેઝ-૨', arch: 'આર્કિટેક્ટ: Royal Architects', top: 'ઉપર જાઓ', lang: 'ભાષા' },
    cursor: { explore: 'જુઓ', drag: 'ખેંચો', view: 'જુઓ', plot: 'તપાસો' },
  },
}

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('rkr-lang') === 'gu' ? 'gu' : 'en' } catch { return 'en' }
  })
  useEffect(() => {
    document.documentElement.lang = lang === 'gu' ? 'gu' : 'en'
    try { localStorage.setItem('rkr-lang', lang) } catch { /* private mode */ }
  }, [lang])
  const toggle = useCallback(() => setLang((l) => (l === 'en' ? 'gu' : 'en')), [])
  const value = useMemo(() => ({ lang, setLang, toggle, t: STR[lang] }), [lang, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
