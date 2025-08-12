import { create } from "zustand";
import { type DataExtraction } from "../ai/schemas/dataExtraction";
import { extractListing, type ExtractInput } from "../ai/extractListing";

export type Issue = {
  id: string;
  severity: "red" | "amber" | "green";
  title: string;
  note?: string;
  estCost?: number;
};

export type Analysis = {
  verdict: "Proceed" | "Proceed with caution" | "Do not proceed";
  hiddenCostTotal: number;
  keyDates: { auction: string; completion?: string };
  topIssues: Issue[];
  riskRegister: Issue[];
  investor: {
    guidePrice: number;
    budget: number;
    depositNeeded: number;
    estRentPm: number;
    grossYieldPct: number;
    cocRoiPct: number;
  };
};

type PackState = {
  // Files (uploaded PDFs)
  files: File[];
  setFiles: (files: File[]) => void;
  clearFiles: () => void;

  // Listing extraction (auction house + guide + link)
  listing: DataExtraction | null;
  setListing: (listing: DataExtraction | null) => void;
  runLocalExtraction: (input: ExtractInput) => { ok: true } | { ok: false; error: string };

  // Analysis (mock + investor maths)
  analysis: Analysis | null;
  loadMock: () => void;
  reset: () => void;
  updateInvestor: (patch: Partial<{
    guidePrice: number;
    budget: number;
    estRentPm: number;
    depositPct: number; // e.g. 10 => 10%
  }>) => void;
};

export const usePack = create<PackState>((set) => ({
  // Files
  files: [],
  setFiles: (files) => set({ files }),
  clearFiles: () => set({ files: [] }),

  // Listing extraction
  listing: null,
  setListing: (listing) => set({ listing }),
  runLocalExtraction: (input) => {
    try {
      const listing = extractListing(input);
      set({ listing });
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Extraction failed" };
    }
  },

  // Analysis (mock)
  analysis: null,

  loadMock: () =>
    set({
      analysis: {
        verdict: "Proceed with caution",
        hiddenCostTotal: 18250,
        keyDates: { auction: "2025-09-10", completion: "2025-10-08" },
        topIssues: [
          { id: "i1", severity: "red",   title: "Short lease (69 years)", note: "May limit mortgage options", estCost: 12000 },
          { id: "i2", severity: "amber", title: "Service charge arrears", note: "Seller to clear on completion", estCost: 1500 },
          { id: "i3", severity: "amber", title: "Restriction on title",   note: "Consent required" },
          { id: "i4", severity: "green", title: "Searches provided",      note: "OK" },
          { id: "i5", severity: "green", title: "No damp/structural flags (pack)" }
        ],
        riskRegister: [
          { id: "r1", severity: "red",   title: "Ground rent escalator", note: "Review clause for 10-year doubles" },
          { id: "r2", severity: "amber", title: "Special condition: buyer pays legal fees", estCost: 1750 },
          { id: "r3", severity: "amber", title: "Indemnity for missing FENSA", estCost: 250 }
        ],
        investor: {
          guidePrice: 160000,
          budget: 190000,
          depositNeeded: 19000,
          estRentPm: 1150,
          grossYieldPct: 7.2,
          cocRoiPct: 11.4
        }
      }
    }),

  reset: () => set({ analysis: null, listing: null, files: [] }),

  updateInvestor: (patch) =>
    set((s) => {
      if (!s.analysis) return s;

      const cur = s.analysis.investor;
      const price = patch.guidePrice ?? cur.guidePrice;
      const budget = patch.budget ?? cur.budget;
      const rent = patch.estRentPm ?? cur.estRentPm;

      const depositPct =
        patch.depositPct ??
        (price > 0 ? Math.round((cur.depositNeeded / price) * 100) : 10);

      const depositNeeded = Math.round(price * (depositPct / 100));
      const grossYieldPct = price > 0 ? (rent * 12 * 100) / price : 0;
      const cocRoiPct = depositNeeded > 0 ? (rent * 12 * 100) / depositNeeded : 0;

      return {
        analysis: {
          ...s.analysis!,
          investor: {
            guidePrice: price,
            budget,
            estRentPm: rent,
            depositNeeded,
            grossYieldPct,
            cocRoiPct
          }
        }
      };
    })
}));
