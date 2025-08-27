// src/components/InvestorInputs.tsx
import React from "react";
import useDealValues from "../store/useDealValues";

export default function InvestorInputs() {
  const { values, setValues } = useDealValues((s) => s);

  const set = (patch: Partial<typeof values>) =>
    setValues((curr) => ({ ...curr, ...patch }));

  return (
    <div className="card">
      <div className="text-base font-semibold mb-3">Investor Inputs</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Purchase Price</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            value={values.price ?? ""}
            onChange={(e) => set({ price: e.target.value })}
            placeholder="0"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Monthly Rent</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            value={values.rent ?? ""}
            onChange={(e) => set({ rent: e.target.value })}
            placeholder="0"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Loan Amount</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            value={values.loan ?? ""}
            onChange={(e) => set({ loan: e.target.value })}
            placeholder="0"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Interest Rate (%)</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={values.rate ?? ""}
            onChange={(e) => set({ rate: e.target.value })}
            placeholder="5.50"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Term (years)</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            value={values.term ?? ""}
            onChange={(e) => set({ term: e.target.value })}
            placeholder="25"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Upfront Costs</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            value={values.costs ?? ""}
            onChange={(e) => set({ costs: e.target.value })}
            placeholder="0"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span className="block text-slate-500 mb-1">Postcode</span>
          <input
            className="input"
            value={values.postcode ?? ""}
            onChange={(e) => set({ postcode: e.target.value })}
            placeholder="E.g. B3 2JR"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-500 mb-1">Lender (optional)</span>
          <select
            className="input"
            value={values.lender ?? ""}
            onChange={(e) => set({ lender: e.target.value })}
          >
            <option value="">Generic</option>
            <option value="NatWest">NatWest</option>
            <option value="Barclays">Barclays</option>
            <option value="Santander">Santander</option>
          </select>
        </label>

        <label className="text-sm md:col-span-3 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!values.includeSdlt}
            onChange={(e) => set({ includeSdlt: e.target.checked })}
          />
          <span className="text-slate-600">include SDLT in cash-in</span>
        </label>
      </div>
    </div>
  );
}
