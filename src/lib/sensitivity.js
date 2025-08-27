// Scenario transforms + confidence bump logic for composite scoring.
export function listScenarios() {
    return [
        { key: "BASE", label: "Base" },
        { key: "RATE_UP_200", label: "+200bps" },
        { key: "VOID_2M", label: "Void +2m" },
        { key: "COSTS_UP_15", label: "Costs +15%" },
        { key: "RENT_DOWN_10", label: "Rent −10%" },
    ];
}
export function applyScenario(d, s) {
    switch (s) {
        case "BASE":
            return { ...d };
        case "RATE_UP_200":
            return { ...d, rate: d.rate + 0.02 };
        case "VOID_2M": {
            const rentAnnual = d.rentMonthly * 12;
            const adjusted = ((12 - 2) / 12) * rentAnnual / 12;
            return { ...d, rentMonthly: adjusted };
        }
        case "COSTS_UP_15":
            return { ...d, costsAnnual: Math.round(d.costsAnnual * 1.15) };
        case "RENT_DOWN_10":
            return { ...d, rentMonthly: d.rentMonthly * 0.9 };
    }
}
/**
 * Confidence bump: if ≥3/5 scenarios are GREEN, +5; if ≤1/5 are GREEN, −5; else 0.
 */
export function confidenceBump(outcomes) {
    const greens = Object.values(outcomes).filter((c) => c === "GREEN").length;
    if (greens >= 3)
        return +5;
    if (greens <= 1)
        return -5;
    return 0;
}
