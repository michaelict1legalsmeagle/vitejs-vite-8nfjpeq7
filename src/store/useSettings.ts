import { create } from "zustand";

export type TaxBand = "basic" | "higher";
export type Tenancy = "single" | "hmo";

export type SettingsState = {
  lenderId: string;
  product: "BTL_IO" | "BTL_Repay";
  taxBand: TaxBand;
  tenancy: Tenancy;
  set: (p: Partial<SettingsState>) => void;
};

const KEY = "settings.v1";

const initial: SettingsState = (() => {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (j && typeof j === "object") return {
      lenderId: j.lenderId || "GENERIC",
      product: j.product || "BTL_IO",
      taxBand: j.taxBand || "higher",
      tenancy: j.tenancy || "single",
      set: () => {},
    } as SettingsState;
  } catch {}
  return {
    lenderId: "GENERIC",
    product: "BTL_IO",
    taxBand: "higher",
    tenancy: "single",
    set: () => {},
  } as SettingsState;
})();

export const useSettings = create<SettingsState>((set, get) => ({
  ...initial,
  set: (p) => {
    const next = { ...get(), ...p };
    set(p);
    const { set: _omit, ...persist } = next as any;
    localStorage.setItem(KEY, JSON.stringify(persist));
  },
}));
