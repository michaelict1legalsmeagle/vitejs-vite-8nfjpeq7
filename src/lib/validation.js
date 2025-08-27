// src/lib/validation.ts
// Centralised validation that reuses the SAME schema as the live store.
// This avoids tests and UI diverging.
// Re-export the schema from the store (single source of truth)
import { dealSchema } from "../store/useDealValues";
export { dealSchema };
// Keep a postcode helper for any callers that used it before.
export function sanitisePostcode(raw) {
    const s = String(raw ?? "").toUpperCase().trim().replace(/\s+/g, " ");
    if (!s)
        return "";
    // collapse to letters/digits/space only
    const cleaned = s.replace(/[^A-Z0-9 ]/g, "");
    // if there is no space and length > 3, insert one before the inward code
    if (!cleaned.includes(" ") && cleaned.length > 3) {
        return cleaned.slice(0, -3) + " " + cleaned.slice(-3);
    }
    return cleaned;
}
/**
 * Merge a partial patch into a base object, then validate + coerce with the
 * same schema the app uses. If parsing fails (very rare with our coercers),
 * it will throw—surface that during tests/CI.
 */
export function validatePatch(base, patch) {
    const merged = { ...base, ...patch };
    return dealSchema.parse(merged);
}
