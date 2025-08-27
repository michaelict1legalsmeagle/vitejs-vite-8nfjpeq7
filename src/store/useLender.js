import { create } from "zustand";
export const useLender = create((set) => ({
    lenderId: "GENERIC",
    set: (id) => set({ lenderId: id })
}));
