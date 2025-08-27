// src/store/useMetrics.ts
import { create } from "zustand";
import { fetchAreaDemo } from "../api/area";
import { fetchAreaLive } from "../api/area.live";
// pick API base from env or window override
const API_BASE = import.meta.env?.VITE_PROXY_BASE ||
    window.__LEXLOT_API__ ||
    null;
export const useMetrics = create((set, get) => ({
    loading: false,
    error: null,
    metrics: null,
    comps: [],
    async fetchDemo(postcode) {
        set({ loading: true, error: null });
        try {
            const useLive = !!API_BASE;
            const { metrics, comps } = useLive
                ? await fetchAreaLive(postcode) // real data via your proxy
                : await fetchAreaDemo(postcode); // local stub fallback
            set({ metrics, comps, loading: false });
            // optional toast so you know which path ran
            window.dispatchEvent(new CustomEvent("lexlot:toast", {
                detail: { message: useLive ? "Live area data ✓" : "Demo area data ✓" },
            }));
        }
        catch (e) {
            set({ error: e?.message ?? "Failed to fetch area data", loading: false });
        }
    },
    clear: () => set({ metrics: null, comps: [], error: null }),
    compareYield: (guidePrice, estRentPm) => {
        const m = get().metrics;
        const area = m?.grossYieldAvgPct ?? null;
        if (!guidePrice || !estRentPm)
            return { subjectYieldPct: null, areaYieldPct: area, deltaPct: null };
        const subject = Math.round(((estRentPm * 12) / guidePrice) * 1000) / 10; // 1dp
        const delta = area != null ? Math.round((subject - area) * 10) / 10 : null;
        return { subjectYieldPct: subject, areaYieldPct: area, deltaPct: delta };
    },
}));
