// Tiny, fast scenario engine used by ScenarioChips / OverallScore
// ---------- public API ----------
export function listScenarios() {
    return SCENARIOS.map(({ key, label }) => ({ key, label }));
}
export function applyScenario(deal, key) {
    const s = SCENARIOS_MAP[key];
    if (!s)
        return { ...deal };
    return s.mutate(deal);
}
/**
 * Confidence tweak to composite score:
 *  - GREEN in >= 3 of 5 scenarios => +5 points
 *  - GREEN in <= 1 of 5 scenarios => -5 points
 *  - otherwise 0
 */
export function confidenceBump(results) {
    const keys = ["BASE", "RATE_UP_200", "VOID_2M", "COSTS_UP_15", "RENT_DOWN_10"];
    const greens = keys.reduce((n, k) => n + (results[k] === "GREEN" ? 1 : 0), 0);
    if (greens >= 3)
        return +5;
    if (greens <= 1)
        return -5;
    return 0;
}
// ---------- internals ----------
const SCENARIOS = [
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
const SCENARIOS_MAP = Object.fromEntries(SCENARIOS.map((s) => [s.key, s]));
