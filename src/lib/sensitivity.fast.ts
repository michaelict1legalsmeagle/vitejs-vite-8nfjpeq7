// Tiny, fast scenario engine used by ScenarioChips / OverallScore

export type ScenarioKey =
  | "BASE"
  | "RATE_UP_200"   // +200 bps to interest rate
  | "VOID_2M"       // 2 months vacancy
  | "COSTS_UP_15"   // +15% operating costs
  | "RENT_DOWN_10"; // -10% rent

type DealLike = {
  price: number;
  rentMonthly: number;
  loan: number;
  rate: number;        // annual, e.g. 0.055
  termYears: number;
  costsAnnual: number;
  postcode?: string;
  product?: "IO" | "Repay";
  [k: string]: any;
};

type ScenarioDef = {
  key: ScenarioKey;
  label: string;
  mutate: (d: DealLike) => DealLike;
};

// ---------- public API ----------

export function listScenarios(): { key: ScenarioKey; label: string }[] {
  return SCENARIOS.map(({ key, label }) => ({ key, label }));
}

export function applyScenario<T extends DealLike>(deal: T, key: ScenarioKey): T {
  const s = SCENARIOS_MAP[key];
  if (!s) return { ...deal };
  return s.mutate(deal) as T;
}

/**
 * Confidence tweak to composite score:
 *  - GREEN in >= 3 of 5 scenarios => +5 points
 *  - GREEN in <= 1 of 5 scenarios => -5 points
 *  - otherwise 0
 */
export function confidenceBump(results: Record<ScenarioKey, "GREEN" | "AMBER" | "RED">): number {
  const keys: ScenarioKey[] = ["BASE", "RATE_UP_200", "VOID_2M", "COSTS_UP_15", "RENT_DOWN_10"];
  const greens = keys.reduce((n, k) => n + (results[k] === "GREEN" ? 1 : 0), 0);
  if (greens >= 3) return +5;
  if (greens <= 1) return -5;
  return 0;
}

// ---------- internals ----------

const SCENARIOS: ScenarioDef[] = [
  {
    key: "BASE",
    label: "Base",
    mutate: (d) => ({ ...d }),
  },
  {
    key: "RATE_UP_200",
    label: "+200bps",
    mutate: (d) => ({ ...d, rate: Math.max(0, (d.rate ?? 0) + 0.02) }),
  },
  {
    key: "VOID_2M",
    label: "Void +2m",
    mutate: (d) => ({ ...d, rentMonthly: Math.max(0, (d.rentMonthly ?? 0) * (10 / 12)) }),
  },
  {
    key: "COSTS_UP_15",
    label: "Costs +15%",
    mutate: (d) => ({ ...d, costsAnnual: Math.max(0, (d.costsAnnual ?? 0) * 1.15) }),
  },
  {
    key: "RENT_DOWN_10",
    label: "Rent –10%",
    mutate: (d) => ({ ...d, rentMonthly: Math.max(0, (d.rentMonthly ?? 0) * 0.9) }),
  },
];

const SCENARIOS_MAP: Record<ScenarioKey, ScenarioDef> = Object.fromEntries(
  SCENARIOS.map((s) => [s.key, s])
) as any;
