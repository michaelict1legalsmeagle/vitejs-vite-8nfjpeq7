// src/lib/lenders.ts
// Minimal lender stress rules. Expand with real broker data later.
const TABLE = {
    NatWest: { name: "NatWest", stressFloorPct: 7.0, notes: "ICR floor 7% for BTL IO" },
    Barclays: { name: "Barclays", stressFloorPct: 6.75, notes: "ICR floor 6.75% for IO" },
    "BM Solutions": { name: "BM Solutions", stressFloorPct: 7.0 },
    Skipton: { name: "Skipton", stressFloorPct: 6.5 },
    TSB: { name: "TSB", stressFloorPct: 6.75 },
    Generic: { name: "Generic", stressFloorPct: 5.5, notes: "Fallback if lender not selected" },
};
export function lenderStress(lender) {
    if (!lender)
        return TABLE.Generic;
    return TABLE[lender] ?? TABLE.Generic;
}
export function listLenders() {
    return Object.values(TABLE);
}
