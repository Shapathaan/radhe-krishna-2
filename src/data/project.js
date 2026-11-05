// Single source of truth for verified project facts. Edit here, not in components.
export const PROJECT = {
  name: 'Radhe Krishna Residency',
  phase: 'Phase 02',
  phone: '+91 70692 33183',
  whatsappNumber: '917069233183',
  startingPriceLakh: 2.41,
  // Verified via the QR code printed on the brochure ("Scan QR for Location").
  mapsUrl: 'https://maps.app.goo.gl/x34e83w7n9kUaMmq8',
  // Exact coordinates are NOT known. Add { lat, lng } here once verified and the
  // location section will place a pin automatically.
  coordinates: null,
  brochureUrl: '/assets/radhe-krishna-brochure.pdf',
  planImage: '/assets/plan-2.png',
  film: { src: '/assets/project-film.mp4', poster: '/assets/film-poster.jpg', hasAudio: false },
}

export const GALLERY = ['02', '03', '04', '05', '06', '07'].map((n, i) => ({
  id: n,
  src: `/assets/site-${n}.jpeg`,
  key: `g${i + 1}`,
}))
