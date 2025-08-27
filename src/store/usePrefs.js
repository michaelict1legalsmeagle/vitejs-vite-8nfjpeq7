import { create } from "zustand";
import { persist } from "zustand/middleware";
const DEFAULT_WEIGHTS = {
    net: 18,
    coc: 18,
    icr: 16,
    roi5: 14,
    breakeven: 10,
    ltv: 10,
    gross: 6,
    sdlt: 4,
};
const initial = {
    tenancy: "single",
    taxBand: "basic",
    product: "IO",
    weights: DEFAULT_WEIGHTS,
    targets: {}, // none by default
};
export const usePrefs = create()(persist((set, get) => ({
    values: initial,
    set(patch) {
        set((s) => ({ values: { ...s.values, ...patch } }));
    },
    setTarget(metric, value) {
        set((s) => ({
            values: {
                ...s.values,
                targets: {
                    ...s.values.targets,
                    ...(value == null ? { [metric]: undefined } : { [metric]: value }),
                },
            },
        }));
    },
    setWeight(metric, w) {
        set((s) => ({
            values: { ...s.values, weights: { ...s.values.weights, [metric]: w } },
        }));
    },
    resetTargets() {
        set((s) => ({ values: { ...s.values, targets: {} } }));
    },
}), { name: "prefs.v1" }));
