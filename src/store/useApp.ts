// src/store/useApp.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Scenario = "DEFAULT" | "USER" | "LENDER" | "REGION";
export type Values = Record<string, unknown>;

type AppState = {
  scenario: Scenario;
  values: Values;

  setScenario: (s: Scenario) => void;
  setValue: (key: string, val: unknown) => void;
  setValues: (patch: Partial<Values>) => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      scenario: "DEFAULT",
      values: {},

      // return a NEW state object (no in-place mutation)
      setScenario: (s) =>
        set((st) => ({
          ...st,
          scenario: s,
        })),

      // replace values object identity so subscribers fire
      setValue: (key, val) =>
        set((st) => ({
          ...st,
          values: { ...st.values, [key]: val },
        })),

      // merge patch immutably
      setValues: (patch) =>
        set((st) => ({
          ...st,
          values: { ...st.values, ...patch },
        })),
    }),
    { name: "app.v1" }
  )
);
// Debug only — expose store on window for DevTools
// @ts-ignore
if (typeof window !== "undefined") (window as any).useApp = useApp;
