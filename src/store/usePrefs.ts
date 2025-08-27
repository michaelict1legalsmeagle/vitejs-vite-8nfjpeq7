import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MetricKey =
  | "gross"
  | "net"
  | "coc"
  | "icr"
  | "roi5"
  | "breakeven"
  | "ltv"
  | "sdlt";

type Weights = Partial<Record<MetricKey, number>>;
type Targets = Partial<Record<MetricKey, number>>;

export type PrefValues = {
  // display / app
  tenancy: "single" | "hmo";
  taxBand: "basic" | "higher" | "additional";
  product: "IO" | "Repay";

  // scoring
  weights: Weights;
  targets: Targets; // user overrides per metric (e.g. net: 0.06)
};

type PrefState = {
  values: PrefValues;
  set: (patch: Partial<PrefValues>) => void;
  setTarget: (metric: MetricKey, value: number | null) => void;
  setWeight: (metric: MetricKey, w: number) => void;
  resetTargets: () => void;
};

const DEFAULT_WEIGHTS: Weights = {
  net: 18,
  coc: 18,
  icr: 16,
  roi5: 14,
  breakeven: 10,
  ltv: 10,
  gross: 6,
  sdlt: 4,
};

const initial: PrefValues = {
  tenancy: "single",
  taxBand: "basic",
  product: "IO",
  weights: DEFAULT_WEIGHTS,
  targets: {}, // none by default
};

export const usePrefs = create<PrefState>()(
  persist(
    (set, get) => ({
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
    }),
    { name: "prefs.v1" }
  )
);
