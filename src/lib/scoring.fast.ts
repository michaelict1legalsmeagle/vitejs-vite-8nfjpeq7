// src/lib/scoring.fast.ts
// Lightweight helpers shared by OverallScore / ScenarioChips / Explainer / Metrics

export type BandColour = "GREEN" | "AMBER" | "RED";

export type BandDef = {
  green: number;
  amber: number;
  invert?: boolean; // true => lower is better
};

/** Map a numeric value to GREEN/AMBER/RED given band thresholds. */
export function bandify(value: number, band: BandDef): BandColour {
  const v = Number(value) || 0;
  const g = Number(band?.green) ?? 0;
  const a = Number(band?.amber) ?? 0;
  const inv = !!band?.invert;

  if (inv) {
    // lower is better
    if (v <= g) return "GREEN";
    if (v <= a) return "AMBER";
    return "RED";
  }
  // higher is better
  if (v >= g) return "GREEN";
  if (v >= a) return "AMBER";
  return "RED";
}

/** Convert a band to points (used for weighted score). */
export function points(colour: BandColour): 100 | 70 | 40 {
  return colour === "GREEN" ? 100 : colour === "AMBER" ? 70 : 40;
}

/**
 * Weighted composite score from a set of items.
 * Accepts either a Record or an Array of { band, w }.
 * Returns score 0–100 and overall band (>=75 GREEN, >=60 AMBER else RED).
 */
export function composite<T extends { band: BandColour; w?: number }>(
  items:
    | Record<string, T>
    | Array<T>,
  fallbackWeights?: Record<string, number>
): { score: number; overall: BandColour } {
  let raw = 0;
  let tot = 0;

  if (Array.isArray(items)) {
    for (const it of items) {
      const w = Number(it.w ?? 0) || 0;
      if (w <= 0) continue;
      raw += (points(it.band) * w) / 100;
      tot += w;
    }
  } else if (items && typeof items === "object") {
    for (const k of Object.keys(items)) {
      const it = items[k];
      const w = Number(it?.w ?? fallbackWeights?.[k] ?? 0) || 0;
      if (w <= 0) continue;
      raw += (points(it.band) * w) / 100;
      tot += w;
    }
  }

  const score = Math.max(0, Math.min(100, Math.round((raw / (tot || 1)) * 100)));
  const overall: BandColour = score >= 75 ? "GREEN" : score >= 60 ? "AMBER" : "RED";
  return { score, overall };
}
