import React from "react";
import { analyze } from "../lib/api";

export default function DealSummary() {
  const [guidePrice, setGuidePrice] = React.useState<string>("200000");
  const [rentPcm, setRentPcm] = React.useState<string>("1200");

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    guidePrice: number;
    rentPcm: number;
    grossYieldPct: number;
  } | null>(null);

  async function run() {
    setErr(null); setResult(null);
    const gp = Number(guidePrice.replace(/[, ]/g, ""));
    const rp = Number(rentPcm.replace(/[, ]/g, ""));
    if (!Number.isFinite(gp) || !Number.isFinite(rp) || gp <= 0) {
      setErr("Enter a valid guide price and monthly rent.");
      return;
    }
    try {
      setBusy(true);
      const res = await analyze(gp, rp);
      setResult({ guidePrice: res.guidePrice, rentPcm: res.rentPcm, grossYieldPct: res.grossYieldPct });
    } catch (e: any) {
      setErr(e?.message ?? "Analyze failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mb-4" aria-live="polite">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Deal Summary</h3>
        <button className="btn btn-primary" onClick={run} disabled={busy}>
          {busy ? "Calculating…" : "Analyze"}
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="text-sm">
          Guide Price (£)
          <input
            className="input mt-1"
            inputMode="numeric"
            value={guidePrice}
            onChange={(e) => setGuidePrice(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Rent (pcm £)
          <input
            className="input mt-1"
            inputMode="numeric"
            value={rentPcm}
            onChange={(e) => setRentPcm(e.target.value)}
          />
        </label>
        <div className="text-sm mt-5">
          {result ? (
            <div className="flex gap-6">
              <div><span className="text-slate-500">Yield:</span> <b>{result.grossYieldPct.toFixed(1)}%</b></div>
              <div><span className="text-slate-500">Guide:</span> £{result.guidePrice.toLocaleString()}</div>
              <div><span className="text-slate-500">Rent:</span> £{result.rentPcm.toLocaleString()}/mo</div>
            </div>
          ) : (
            <div className="text-slate-500">Enter figures then click Analyze.</div>
          )}
        </div>
      </div>

      {err && <div className="text-xs text-red-600 mt-2">{err}</div>}
    </div>
  );
}
