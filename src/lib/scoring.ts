import type { Band, MetricColour, MetricResult } from "./types";

export function bandify(value: number, band: Band): MetricColour {
  if (value == null || Number.isNaN(value)) return "RED";
  const { green, amber, invert } = band;
  if (invert) {
    if (value <= green) return "GREEN";
    if (value <= amber) return "AMBER";
    return "RED";
  }
  if (value >= green) return "GREEN";
  if (value >= amber) return "AMBER";
  return "RED";
}

export function points(colour: MetricColour): 100 | 70 | 40 {
  return colour === "GREEN" ? 100 : colour === "AMBER" ? 70 : 40;
}

export function composite(
  perMetric: Record<string, MetricResult>,
  weights: Record<string, number>
): { score: number; overall: MetricColour } {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 100;
  const raw = Object.entries(perMetric).reduce((sum, [k, r]) => {
    const w = weights[k] ?? 0;
    return sum + (w * r.points) / 100;
  }, 0);
  const score = Math.round((raw / totalWeight) * 100);
  const overall = score >= 75 ? "GREEN" : score >= 60 ? "AMBER" : "RED";
  return { score, overall };
}
