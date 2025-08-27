import React from "react";
import useDealValues from "../store/useDealValues";

type NumKey = "price" | "rent" | "loan" | "rate" | "term" | "costs";

export default function InvestorInputs() {
  const { values, setValues } = useDealValues((s) => s);

  // Store-level coercion handles strings like "£250,000" or "6.25%"
  const onNum = (k: NumKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues({ [k]: e.target.value } as any);
  const onText =
    (k: "postcode") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues({ [k]: e.target.value });
  const onLender = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setValues({ lender: e.target.value });
  const onProduct = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setValues({ product: e.target.value as any });
  const onInclude = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues({ includeSdlt: e.target.checked });

  const v = (n: number | null | undefined) =>
    n ?? n === 0 ? String(n ?? "") : "";

  return (
    <div className="card">
      <h2 className="text-base font-semibold mb-3">Investor Inputs</h2>

      {/* 3-column grid like your preferred layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Price */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Purchase Price</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            value={v(values.price)}
            onChange={onNum("price")}
          />
        </label>

        {/* Rent */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Monthly Rent</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            value={v(values.rent)}
            onChange={onNum("rent")}
          />
        </label>

        {/* Loan */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Loan Amount</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            value={v(values.loan)}
            onChange={onNum("loan")}
          />
        </label>

        {/* Rate */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Interest Rate (%)</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            value={v(values.rate)}
            onChange={onNum("rate")}
          />
        </label>

        {/* Term */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Term (years)</span>
          <input
            className="input"
            inputMode="numeric"
            placeholder="0"
            value={v(values.term)}
            onChange={onNum("term")}
          />
        </label>

        {/* Upfront costs */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Upfront Costs</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            value={v(values.costs)}
            onChange={onNum("costs")}
          />
        </label>

        {/* Product */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Product</span>
          <select className="input" value={values.product || ""} onChange={onProduct}>
            <option value="">—</option>
            <option value="IO">Interest Only</option>
            <option value="REPAY">Repayment</option>
          </select>
        </label>

        {/* Postcode */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Postcode</span>
          <input
            className="input"
            placeholder="E.g. B3 2JR"
            value={values.postcode || ""}
            onChange={onText("postcode")}
          />
        </label>

        {/* Lender dropdown */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Lender (optional)</span>
          <select className="input" value={values.lender || ""} onChange={onLender}>
            <option value="">Generic</option>
            <option value="NatWest">NatWest</option>
            <option value="Barclays">Barclays</option>
            <option value="HSBC">HSBC</option>
          </select>
        </label>
      </div>

      {/* SDLT toggle sits UNDER the grid, left-aligned */}
      <label className="mt-3 inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="checkbox"
          checked={!!values.includeSdlt}
          onChange={onInclude}
        />
        <span className="text-sm text-slate-600 dark:text-slate-300">
          include SDLT in cash-in
        </span>
      </label>
    </div>
  );
}
