import { create } from "zustand";

export type ScenarioKey = "BASE" | "RATE_UP_200" | "VOID_2M" | "COSTS_UP_15" | "RENT_DOWN_10";

type UIState = {
  scenario: ScenarioKey;
  setScenario: (s: ScenarioKey) => void;
};

export const useUI = create<UIState>((set) => ({
  scenario: "BASE",
  setScenario: (s) => set({ scenario: s }),
}));
