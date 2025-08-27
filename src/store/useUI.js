import { create } from "zustand";
export const useUI = create((set) => ({
    scenario: "BASE",
    setScenario: (s) => set({ scenario: s }),
}));
