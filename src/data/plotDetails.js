// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED PLOT DATA  (plug-in point — nothing here is invented)
//
// The 3D geometry (siteGeometry.js) was traced from the brochure plan drawing and
// each plot has an internal id (G001…). The brochure prints plot numbers, areas
// and dimensions, but they have NOT been transcribed/verified yet, so they are
// intentionally empty. To enable them, add entries keyed by geometry id:
//
//   G001: { number: '001', areaSqft: 1183, widthFt: 24, depthFt: 49, status: 'available' }
//
// status: 'available' | 'reserved' | 'sold'  — only add when connected to real sales data.
// ─────────────────────────────────────────────────────────────────────────────
export const PLOT_DETAILS = {}

// Printed on the brochure plan.
export const COMMON_DETAILS = {
  C1: { name: 'Common Plot-2', areaSqft: 5990 },
  C2: { name: 'Common Plot', areaSqft: 7658 },
}

// Set true only once PLOT_DETAILS[*].status is fed from a real source.
export const AVAILABILITY_CONNECTED = false
