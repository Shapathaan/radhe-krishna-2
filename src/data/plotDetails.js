// Verified brochure facts only. Numbered plot metadata is intentionally not
// attached to geometry IDs until each G### polygon is visually matched to the
// corresponding numbered plot in the brochure. See BROCHURE-DATA-AUDIT.md.
export const PLOT_DETAILS = {}

// These names and areas are transcribed from the printed master-plan labels.
export const COMMON_DETAILS = {
  C1: { name: 'Common Plot-2', nameGu: 'કોમન પ્લોટ-૨', areaSqft: 5990 },
  C2: { name: 'Common Plot', nameGu: 'કોમન પ્લોટ', areaSqft: 7658 },
}

// Printed road widths. Kept separate from geometry dimensions because the
// brochure drawing is illustrative and is not a survey-scale plan.
export const ROAD_DETAILS = {
  crossoverWidthFt: 40,
  internalRoadWidthFt: 25,
}

// Availability is not connected to a live sales/inventory source.
export const AVAILABILITY_CONNECTED = false
