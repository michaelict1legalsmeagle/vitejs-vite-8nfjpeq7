// src/store/useApp.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Values = Record<string, number | string | null>;

type AppState = {
  scenario: "DEFAULT" | "USER" | "LENDER" | "REGION";
  values: Values;
  setScenario: (s: AppState["scenario"]) => void;
  setValue: (k: string, v: any) => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      scenario: "DEFAULT",
      values: {},
      setScenario: (s) =>
        set((st) => ({
          ...st,
          scenario: s,
          // touch a version flag if your metrics subscribe shallowly
          _v: (Math.random() + performance.now()).toString(),
        })),
      setValue: (k, v) =>
        set((st) => ({
          ...st,
          values: { ...st.values, [k]: v }, // REPLACE object identity
        })),
    }),
    { name: "app.v1" }
  )
);
