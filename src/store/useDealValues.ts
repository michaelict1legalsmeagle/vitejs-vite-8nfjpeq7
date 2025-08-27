// src/store/useDealValues.ts
// Live inputs store (single scenario currently in-memory).
// - Strong coercion (currency, commas, percents, whitespace)
// - Sensible clamping (term 1–50 yrs, non-negatives)
// - Postcode normalization ("b3   2jr" -> "B3 2JR")
// - Minimal surface: { values, setValues, reset }

import { create } from "zustand";
import { z } from "zod";
import type { DealInputs } from "../lib/metrics";

/* ------------------------------- Coercers ------------------------------- */

function toNumberLike(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const s = x.trim();
    if (!s) return null;
    const cleaned = s
      .replace(/£/g, "")
      .replace(/,/g, "")
      .replace(/_/g, "")
      .replace(/\s+/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toPercentLike(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const s = x.trim();
    if (!s) return null;
    const pct = s.endsWith("%");
    const n = Number(s.replace("%", "").replace(/,/g, "").trim());
    if (!Number.isFinite(n)) return null;
    return pct ? n : n; // store as percent units, e.g. 6.25
  }
  return null;
}

function clamp(n: number | null, min: number, max: number): number | null {
  if (n === null) return null;
  return Math.min(Math.max(n, min), max);
}

function clampFloor(n: number | null, min: number): number | null {
  if (n === null) return null;
  return Math.max(n, min);
}

function normalisePostcode(x: unknown): string {
  if (typeof x !== "string") return "";
  const s = x.trim().replace(/\s+/g, " ");
  if (!s) return "";
  const up = s.toUpperCase();
  if (!up.includes(" ") && up.length > 3) {
    return up.slice(0, -3) + " " + up.slice(-3);
  }
  return up;
}

/* ------------------------------- Schema ------------------------------- */

// Numbers are stored as numbers; percent is e.g. 6.25 (not 0.0625).
export const dealCore = z.object({
  price: z.preprocess((v) => toNumberLike(v), z.number().nonnegative().nullable().optional()),
  rent: z.preprocess((v) => toNumberLike(v), z.number().nonnegative().nullable().optional()),
  loan: z.preprocess((v) => toNumberLike(v), z.number().nonnegative().nullable().optional()),
  rate: z.preprocess((v) => toPercentLike(v), z.number().nonnegative().nullable().optional()),
  term: z.preprocess(
    (v) => {
      const n = toNumberLike(v);
      if (n === null) return null;
      return clamp(Math.round(n), 1, 50);
    },
    z.number().nullable().optional()
  ),
  costs: z.preprocess(
    (v) => {
      const n = toNumberLike(v);
      return clampFloor(n ?? 0, 0);
    },
    z.number().nullable().optional()
  ),
  product: z.enum(["", "IO", "REPAY"]).optional(),
  postcode: z.preprocess((v) => normalisePostcode(v), z.string().optional()),
  lender: z.string().optional(),
  includeSdlt: z.preprocess((v) => {
    // robust boolean coercion: true/false/"true"/"false"/1/0/yes/no
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "yes") return true;
      if (s === "false" || s === "0" || s === "no") return false;
    }
    return false;
  }, z.boolean().optional()),
  scenario: z.string().optional(),
});

// ✅ Allow stray keys like `patch`/`paint` without throwing.
export const dealSchema = dealCore.passthrough();

export type LiveValues = z.infer<typeof dealSchema>;

/* ---------------------------- Initial Values ---------------------------- */

const DEFAULTS: LiveValues = {
  price: null,
  rent: null,
  loan: null,
  rate: 5.5,
  term: 25,
  costs: 0,
  product: "",
  postcode: "",
  lender: "",
  includeSdlt: false,
  scenario: "Base",
};

/* ------------------------------ The Store ------------------------------ */

type DealValuesState = {
  values: DealInputs;
  setValues: (
    patch: Partial<DealInputs> | ((current: DealInputs) => Partial<DealInputs>)
  ) => void;
  reset: () => void;
};

function toDealInputs(v: LiveValues): DealInputs {
  return {
    price: v.price ?? null,
    rent: v.rent ?? null,
    loan: v.loan ?? null,
    rate: v.rate ?? null,
    term: v.term ?? null,
    costs: v.costs ?? null,
    product: v.product ?? "",
    postcode: v.postcode ?? "",
    scenario: v.scenario,
    lender: v.lender ?? "",
    includeSdlt: !!v.includeSdlt,
  };
}

function parsePatch(current: DealInputs, patch: Partial<DealInputs>): DealInputs {
  const merged: any = { ...current, ...patch };
  const parsed = dealSchema.parse(merged);
  return toDealInputs(parsed);
}

export const useDealValues = create<DealValuesState>((set, get) => ({
  values: toDealInputs(DEFAULTS),

  setValues(patch) {
    const current = get().values;
    const delta = typeof patch === "function" ? patch(current) : patch;

    // Support function-valued fields in patches (used by ScenarioChips)
    const resolved: Record<string, unknown> = { ...delta };
    for (const [k, v] of Object.entries(delta)) {
      if (typeof v === "function") {
        // @ts-expect-error runtime convenience
        resolved[k] = (v as any)(current);
      }
    }

    const next = parsePatch(current, resolved as Partial<DealInputs>);
    set({ values: next });
  },

  reset() {
    set({ values: toDealInputs(DEFAULTS) });
  },
}));

export default useDealValues;
