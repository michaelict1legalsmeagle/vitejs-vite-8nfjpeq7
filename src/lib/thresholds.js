/**
 * Very small, explicit stress-rate floors.
 * These are indicative defaults and easy to override per lender.
 */
const REGION_FLOOR = {
    England: 5.5,
    Wales: 5.5,
    Scotland: 6.0,
    "Northern Ireland": 5.5,
    Unknown: 5.5,
};
/** Case-insensitive lender floors (IO-style stress). */
const LENDER_FLOOR = {
    // examples—tune as you like
    "natwest": 7.0,
    "barclays": 8.0,
    "hsbc": 6.5,
    "generic": 5.5,
};
/**
 * Resolve the stress rate used for ICR.
 * Priority: explicit lender floor (if we recognise it) → region floor.
 */
export function stressFloorFor(region, lender, _product = "") {
    const key = String(lender || "").trim().toLowerCase();
    if (key && key in LENDER_FLOOR)
        return LENDER_FLOOR[key];
    return REGION_FLOOR[region] ?? REGION_FLOOR.Unknown;
}
