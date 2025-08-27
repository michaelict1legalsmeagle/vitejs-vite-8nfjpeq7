import { create } from "zustand";
const KEY = "settings.v1";
const initial = (() => {
    try {
        const j = JSON.parse(localStorage.getItem(KEY) || "null");
        if (j && typeof j === "object")
            return {
                lenderId: j.lenderId || "GENERIC",
                product: j.product || "BTL_IO",
                taxBand: j.taxBand || "higher",
                tenancy: j.tenancy || "single",
                set: () => { },
            };
    }
    catch { }
    return {
        lenderId: "GENERIC",
        product: "BTL_IO",
        taxBand: "higher",
        tenancy: "single",
        set: () => { },
    };
})();
export const useSettings = create((set, get) => ({
    ...initial,
    set: (p) => {
        const next = { ...get(), ...p };
        set(p);
        const { set: _omit, ...persist } = next;
        localStorage.setItem(KEY, JSON.stringify(persist));
    },
}));
