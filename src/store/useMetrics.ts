// src/store/useMetrics.ts
import { create } from "zustand";
import { fetchAreaDemo, type AreaMetrics, type Comparable } from "../api/area";
import { fetchAreaLive } from "../api/area.live";

type MetricsState = {
  loading: boolean;
  error: string | null;
  metrics: AreaMetrics | null;
  comps: Comparable[];

  fetchDemo: (postcode: string) => Promise<void>; // keeps the same name to avoid touching UI
  clear: () => void;

  compareYield: (guidePrice: number, estRentPm?: number | null) => {
    subjectYieldPct: number | null;
    areaYieldPct: number | null;
    deltaPct: number | null;
  };
};

// pick API base from env or window override
const API_BASE: string | null =
  (import.meta as any).env?.VITE_PROXY_BASE ||
  (window as any).__LEXLOT_API__ ||
  null;

export const useMetrics = create<MetricsState>((set, get) => ({
  loading: false,
  error: null,
  metrics: null,
  comps: [],

  async fetchDemo(postcode: string) {
    set({ loading: true, error: null });
    try {
      const useLive = !!API_BASE;
      const { metrics, comps } = useLive
        ? await fetchAreaLive(postcode)   // real data via your proxy
        : await fetchAreaDemo(postcode);  // local stub fallback
      set({ metrics, comps, loading: false });
      // optional toast so you know which path ran
      window.dispatchEvent(
        new CustomEvent("lexlot:toast", {
          detail: { message: useLive ? "Live area data ✓" : "Demo area data ✓" },
        })
      );
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to fetch area data", loading: false });
    }
  },

  clear: () => set({ metrics: null, comps: [], error: null }),

  compareYield: (guidePrice: number, estRentPm?: number | null) => {
    const m = get().metrics;
    const area = m?.grossYieldAvgPct ?? null;
    if (!guidePrice || !estRentPm)
      return { subjectYieldPct: null, areaYieldPct: area, deltaPct: null };
    const subject = Math.round(((estRentPm * 12) / guidePrice) * 1000) / 10; // 1dp
    const delta = area != null ? Math.round((subject - area) * 10) / 10 : null;
    return { subjectYieldPct: subject, areaYieldPct: area, deltaPct: delta };
  },
}));
