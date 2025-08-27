// src/lib/resolveBands.fast.ts
// Dynamic band resolver with USER > LENDER > REGION > DEFAULT priority.
// Includes `source` so the UI can explain where thresholds came from.
// Optional "belt" mode hardens thresholds so they are always sensible.

export type MetricKey =
  | "gross"
  | "net"
  | "coc"
  | "icr"
  | "roi5"
  | "breakeven"
  | "ltv"
  | "sdlt";

export type Band = {
  /** threshold to be GREEN */
  green: number;
  /** threshold to be AMBER (below/above green depending on invert) */
  amber: number;
  /** true => lower is better (ltv, breakeven, sdlt) */
  invert?: boolean;
  /** provenance for UI copy */
  source: "USER" | "LENDER" | "REGION" | "DEFAULT";
};

export type PrefUser = {
  targets?: Partial<Record<MetricKey, number>>;
  taxBand?: "basic" | "higher" | "additional";
  tenancy?: "single" | "hmo";
};

export type LenderRule = {
  lenderId: string;
  product: string;   // e.g. "BTL_IO" or "BTL_Repay"
  maxLtv: number;    // e.g. 0.75
  icrBasic: number;  // e.g. 1.25
  icrHigher: number; // e.g. 1.45
  stressRate: number; // e.g. 0.055
};

export type Context = {
  regionId: string;
  tenancy: "single" | "hmo";
  user: PrefUser;
  lender?: LenderRule | null;
  /** region thresholds if available */
  regionBands?: Partial<Record<MetricKey, { g: number; a: number; invert?: boolean }>>;
  /** app defaults (used if nothing else available) */
  defaults: Partial<Record<MetricKey, { g: number; a: number; invert?: boolean }>>;
};

export type ResolveOpts = {
  /** When true, coerce/repair thresholds so they’re always safe & sensible. */
  belt?: boolean;
};

/* --------------------------- internal helpers --------------------------- */

// Which metrics are "lower is better"
const INVERT: Record<MetricKey, boolean> = {
  gross: false,
  net: false,
  coc: false,
  icr: false,
  roi5: false,
  breakeven: true,
  ltv: true,
  sdlt: true,
};

// fallback defaults (kept the same as your previous values)
function fallback(metric: MetricKey): { g: number; a: number; invert?: boolean } {
  switch (metric) {
    case "gross": return { g: 0.07, a: 0.05 };                 // 7%, 5%
    case "net": return { g: 0.045, a: 0.03 };                   // 4.5%, 3%
    case "coc": return { g: 0.10, a: 0.07 };                    // 10%, 7%
    case "icr": return { g: 1.45, a: 1.25 };                    // x
    case "roi5": return { g: 0.50, a: 0.30 };                   // 50%, 30%
    case "breakeven": return { g: 0.80, a: 0.90, invert: true };// 80%, 90% (lower better)
    case "ltv": return { g: 0.75, a: 0.80, invert: true };      // 75%, 80% (lower better)
    case "sdlt": return { g: 0.03, a: 0.05, invert: true };     // 3%, 5% (lower better)
  }
}

/** USER targets → band (target = green; amber is a sensible distance away) */
function userOverrideBand(metric: MetricKey, target: number): Band {
  const invert = INVERT[metric];
  if (!Number.isFinite(target) || target < 0) {
    // defend: if they give us nonsense, fall back
    const f = fallback(metric);
    return { green: f.g, amber: f.a, invert: f.invert ?? invert, source: "USER" };
  }
  if (!invert) {
    // higher better -> amber a bit below green
    const green = target;
    const amber = Math.max(0, target * 0.85);
    return { green, amber, invert, source: "USER" };
  } else {
    // lower better -> amber a bit worse (higher) than green
    const green = target;
    const amber = target * 1.10;
    return { green, amber, invert, source: "USER" };
  }
}

/** LENDER floors for icr / ltv if available */
function lenderBand(metric: MetricKey, ctx: Context): Band | null {
  const L = ctx.lender;
  if (!L) return null;

  if (metric === "ltv") {
    return { green: L.maxLtv, amber: L.maxLtv + 0.05, invert: true, source: "LENDER" };
  }
  if (metric === "icr") {
    const tb = ctx.user?.taxBand ?? "basic";
    const floor = tb === "basic" ? L.icrBasic : L.icrHigher;
    // higher is better for ICR → make amber slightly below floor
    return { green: floor, amber: floor * 0.95, invert: false, source: "LENDER" };
  }
  return null;
}

/** REGION thresholds if provided */
function regionBand(metric: MetricKey, ctx: Context): Band | null {
  const r = ctx.regionBands?.[metric];
  if (!r) return null;
  return { green: r.g, amber: r.a, invert: r.invert ?? INVERT[metric], source: "REGION" };
}

/** DEFAULT thresholds (or hard fallback) */
function defaultBand(metric: MetricKey, ctx: Context): Band {
  const d = ctx.defaults[metric] ?? fallback(metric);
  return { green: d.g, amber: d.a, invert: d.invert ?? INVERT[metric], source: "DEFAULT" };
}

/**
 * Harden/repair a band so it’s guaranteed sensible.
 * Ensures: finite, non-negative, and amber sits on the correct side of green.
 */
function hardenBand(metric: MetricKey, band: Band): Band {
  const invert = band.invert ?? INVERT[metric];

  let g = Number.isFinite(band.green) ? band.green : fallback(metric).g;
  let a = Number.isFinite(band.amber) ? band.amber : fallback(metric).a;

  if (g < 0) g = 0;
  if (a < 0) a = 0;

  // Ensure ordering (and avoid equality) based on direction
  if (!invert) {
    // higher better → amber must be <= green; nudge if needed
    if (a > g) a = Math.max(0, g * 0.85);
    if (a === g) a = Math.max(0, g * 0.95);
  } else {
    // lower better → amber must be >= green; nudge if needed
    if (a < g) a = g * 1.10;
    if (a === g) a = g * 1.05;
  }

  // Extra guard for clearly out-of-range percentages that should be 0..1
  // (does not touch x-multipliers like ICR)
  const looksPct = metric !== "icr";
  if (looksPct) {
    // If someone accidentally entered 75 instead of 0.75, coerce down.
    if (g > 1.5) g = g / 100;
    if (a > 1.5) a = a / 100;
    if (g < 0) g = 0;
    if (a < 0) a = 0;
  }

  return { green: g, amber: a, invert, source: band.source };
}

/* ------------------------------ main API ------------------------------ */

export function resolveBands(metric: MetricKey, ctx: Context, opts?: ResolveOpts): Band {
  // 1) USER override (target)
  const t = ctx.user?.targets?.[metric];
  if (typeof t === "number") {
    const b = userOverrideBand(metric, t);
    return opts?.belt ? hardenBand(metric, b) : b;
  }

  // 2) LENDER floors (icr / ltv)
  const lb = lenderBand(metric, ctx);
  if (lb) return opts?.belt ? hardenBand(metric, lb) : lb;

  // 3) REGION band
  const rb = regionBand(metric, ctx);
  if (rb) return opts?.belt ? hardenBand(metric, rb) : rb;

  // 4) DEFAULT
  const db = defaultBand(metric, ctx);
  return opts?.belt ? hardenBand(metric, db) : db;
}
