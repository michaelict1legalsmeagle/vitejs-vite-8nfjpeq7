import { usePack } from "../store/usePack";
import InvestorInputs from "./InvestorInputs";

export default function InvestorMetrics() {
  const a = usePack((s) => s.analysis);
  if (!a) return <p className="text-sm opacity-70">Analyze first to calculate investor metrics.</p>;

  const i = a.investor;

  return (
    <div className="space-y-4">
      <InvestorInputs />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Metric label="Guide Price" value={`£${i.guidePrice.toLocaleString()}`} />
        <Metric label="Your Budget" value={`£${i.budget.toLocaleString()}`} />
        <Metric label="Deposit Needed" value={`£${i.depositNeeded.toLocaleString()}`} />
        <Metric label="Est. Rent / month" value={`£${i.estRentPm.toLocaleString()}`} />
        <Metric label="Gross Yield" value={`${i.grossYieldPct.toFixed(1)}%`} />
        <Metric label="Cash-on-Cash ROI" value={`${i.cocRoiPct.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
