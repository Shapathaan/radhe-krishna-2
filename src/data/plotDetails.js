/**
 * Plot information keyed by the geometry IDs in siteGeometry.js.
 * Only values transcribed and verified from the supplied brochure are populated.
 * Do not infer plot numbers/dimensions from polygon order: the geometry is a
 * raster-traced illustrative reconstruction and is not a survey drawing.
 */
export const PLOT_DETAILS = Object.fromEntries(
  Array.from({ length: 117 }, (_, index) => [`G${String(index + 1).padStart(3, '0')}`, {
    geometryId: `G${String(index + 1).padStart(3, '0')}`,
    number: null,
    areaSqft: null,
    widthFt: null,
    depthFt: null,
    status: null,
  }])
)

// Printed on the supplied brochure master plan.
export const COMMON_DETAILS = {
  C1: { name: 'Common Plot-2', nameGu: 'કોમન પ્લોટ-૨', areaSqft: 5990 },
  C2: { name: 'Common Plot', nameGu: 'કોમન પ્લોટ', areaSqft: 7658 },
}

// Road widths printed on the supplied brochure plan.
export const ROAD_DETAILS = {
  crossover: { widthFt: 40, label: '40 ft wide cross-over road', labelGu: '૪૦ ફૂટ પહોળો ક્રોસ ઓવર રોડ' },
  internal: { widthFt: 25, label: '25 ft wide internal roads', labelGu: '૨૫ ફૂટ પહોળા આંતરિક રસ્તા' },
}

// Availability must be connected to live sales/inventory data before display.
export const AVAILABILITY_CONNECTED = false
