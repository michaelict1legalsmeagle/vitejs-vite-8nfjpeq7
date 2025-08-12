import { useMemo } from "react";
import { usePack } from "../store/usePack";

export default function InvestorInputs() {
  const analysis = usePack((s) => s.analysis);
  const updateInvestor = usePack((s) => s.updateInvestor);

  if (!analysis) {
    return (
      <p className="text-sm opacity-70">
        Click <b>Analyze</b> first to populate investor fields.
      </p>
    );
  }

  const inv = analysis.investor;
  const depositPct = useMemo(
    () =>
      inv.guidePrice > 0
        ? Math.round((inv.depositNeeded / inv.guidePrice) * 100)
        : 10,
    [inv.depositNeeded, inv.guidePrice]
  );

  return (
    <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4" onSubmit={(e) => e.preventDefault()}>
      <Field
        label="Guide Price (£)"
        defaultValue={inv.guidePrice}
        onBlurNumber={(v) => updateInvestor({ guidePrice: v })}
      />
      <Field
        label="Budget (£)"
        defaultValue={inv.budget}
        onBlurNumber={(v) => updateInvestor({ budget: v })}
      />
      <Field
        label="Deposit %"
        defaultValue={depositPct}
        onBlurNumber={(v) => updateInvestor({ depositPct: v })}
      />
      <Field
        label="Est. Rent / month (£)"
        defaultValue={inv.estRentPm}
        onBlurNumber={(v) => updateInvestor({ estRentPm: v })}
      />
    </form>
  );
}

function Field({
  label,
  defaultValue,
  onBlurNumber
}: {
  label: string;
  defaultValue: number;
  onBlurNumber: (v: number) => void;
}) {
  return (
    <label className="card flex flex-col gap-1">
      <span className="text-xs opacity-60">{label}</span>
      <input
        type="number"
        defaultValue={defaultValue}
        className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
        onBlur={(e) => {
          const n = Number(e.currentTarget.value);
          if (!Number.isNaN(n)) onBlurNumber(n);
        }}
      />
    </label>
  );
}
