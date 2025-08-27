import { create } from "zustand";

export type SavedDeal = {
  id: string;
  name: string;
  createdAt: number;
  inputs: {
    price: number; rentMonthly: number; loan: number; rate: number;
    termYears: number; costsAnnual: number; product?: "IO"|"Repay";
  };
  scenario: "BASE" | "RATE_UP_200" | "VOID_2M" | "COSTS_UP_15" | "RENT_DOWN_10";
  metrics: {
    gross:number; net:number; coc:number; icr:number; roi5:number; breakeven:number; ltv:number; sdlt:number;
  };
  score: number;
  overall: "GREEN"|"AMBER"|"RED";
};

type LibState = {
  items: SavedDeal[];
  add: (d: SavedDeal) => void;
  remove: (id: string) => void;
  clear: () => void;
  importJson: (json: string) => void;
  exportJson: () => string;
};

const KEY = "dealLibrary.v1";

function load(): SavedDeal[] {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(j)) return j as SavedDeal[];
  } catch {}
  return [];
}

export const useLibrary = create<LibState>((set, get) => ({
  items: load(),
  add: (d) => set(s => {
    const items = [d, ...s.items].slice(0, 200);
    localStorage.setItem(KEY, JSON.stringify(items));
    return { items };
  }),
  remove: (id) => set(s => {
    const items = s.items.filter(x => x.id !== id);
    localStorage.setItem(KEY, JSON.stringify(items));
    return { items };
  }),
  clear: () => {
    localStorage.setItem(KEY, JSON.stringify([]));
    set({ items: [] });
  },
  importJson: (json) => {
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr)) {
        localStorage.setItem(KEY, JSON.stringify(arr));
        set({ items: arr });
      }
    } catch {}
  },
  exportJson: () => JSON.stringify(get().items, null, 2),
}));
