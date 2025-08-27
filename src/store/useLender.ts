import { create } from "zustand";

export const useLender = create<{ lenderId: string; set: (id: string) => void }>((set) => ({
  lenderId: "GENERIC",
  set: (id) => set({ lenderId: id })
}));
