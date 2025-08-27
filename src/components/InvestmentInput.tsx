import React from "react";
import { useDeals } from "@/store/useSavedDeals"; // <- correct store

type Num = number | "";

/** Safe number parsing that preserves empty input */
function toNum(v: string): Num {
  if (v.trim() === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function InvestmentInput() {
  // current values
  const deal = useDeals((s) => s.values);

  // updater — prefer setValues; fall back to legacy set if it exists
  const setValues =
    useDeals((s: any) => s.setValues || s.set);

  const set = (patch: Partial<typeof deal>) => setValues(patch);

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="text-lg font-semibold">Inputs</div>

      <div className="grid md:grid-cols-3 gap-3">
        <Field
          label="Price"
          type="number"
          value={deal.price as Num}
          onChange={(v) => set({ price: v === "" ? 0 : Number(v) })}
        />
        <Field
          label="Monthly Rent"
          type="number"
          value={deal.rentMonthly as Num}
          onChange={(v) => set({ rentMonthly: v === "" ? 0 : Number(v) })}
        />
        <Field
          label="Loan"
          type="number"
          value={deal.loan as Num}
          onChange={(v) => set({ loan: v === "" ? 0 : Number(v) })}
        />
        <Field
          label="Rate (e.g. 0.055)"
          type="number"
          step="0.001"
          value={deal.rate as Num}
          onChange={(v) => set({ rate: v === "" ? 0 : Number(v) })}
        />
        <Field
          label="Term (years)"
          type="number"
          value={deal.termYears as Num}
          onChange={(v) => set({ termYears: v === "" ? 0 : Number(v) })}
        />
        <Field
          label="Annual Costs"
          type="number"
          value={deal.costsAnnual as Num}
          onChange={(v) => set({ costsAnnual: v === "" ? 0 : Number(v) })}
        />
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: Num;
  onChange: (v: Num) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-xs opacity-70">{label}</span>
      <input
        className="input input-bordered p-2 rounded border"
        type={type}
        step={step}
        value={value === "" ? "" : String(value)}
        onChange={(e) => onChange(toNum(e.target.value))}
      />
    </label>
  );
}
