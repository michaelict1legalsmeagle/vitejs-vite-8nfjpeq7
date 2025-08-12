import React, { useMemo, useState } from "react";
import { useMetrics } from "../store/useMetrics";
import { usePack } from "../store/usePack";

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs opacity-70 mt-1">{label}</div>
      {sub && <div className="text-[11px] opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

export default function AreaComps() {
  const { metrics, comps, loading, error, fetchDemo, clear, compareYield } = useMetrics();
  const analysis = usePack((s) => s.analysis);
  const listing = usePack((s) => s.listing);

  const [postcode, setPostcode] = useState(listing?.lot?.postcode ?? "E1 6AN");
  const [guide, setGuide] = useState<number>(listing?.listing?.guide_price_lower ?? analysis?.investor.guidePrice ?? 200000);
  const [rent, setRent] = useState<number>(analysis?.investor.estRentPm ?? 1000);

  const { subjectYieldPct, areaYieldPct, deltaPct } = compareYield(guide || 0, rent || 0);

  const sold = useMemo(() => comps.filter(c => c.type === "sold").slice(0, 6), [comps]);
  const forsale = useMemo(() => comps.filter(c => c.type === "for_sale").slice(0, 4), [comps]);
  const torent = useMemo(() => comps.filter(c => c.type === "to_rent").slice(0, 4), [comps]);

  const exportArea = () => {
    const payload = { metrics, comps, inputs: { postcode, guide, rent } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lexlot-area-${(postcode || "demo").replace(/\s+/g,"_")}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Area data exported ✓" } }));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col">
          <span className="text-xs opacity-70">Postcode</span>
          <input
            className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
            value={postcode}
            onChange={(e) => setPostcode(e.currentTarget.value)}
            placeholder="E1 6AN"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs opacity-70">Guide price (£)</span>
          <input
            type="number"
            className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
            value={guide ?? ""}
            onChange={(e) => setGuide(parseInt(e.currentTarget.value || "0", 10))}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs opacity-70">Est. monthly rent (£)</span>
          <input
            type="number"
            className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
            value={rent ?? ""}
            onChange={(e) => setRent(parseInt(e.currentTarget.value || "0", 10))}
          />
        </label>

        <div className="flex gap-2 ml-auto">
          <button className="btn" onClick={() => fetchDemo(postcode || "E1 6AN")} disabled={loading}>
            🔎 Fetch demo
          </button>
          <button className="btn" onClick={clear}>🧹 Clear</button>
          <button className="btn" onClick={exportArea}>📤 Export Area JSON</button>
        </div>
      </div>

      {/* Status */}
      {loading && <div className="text-sm opacity-70">Loading area metrics…</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}
      {!metrics && !loading && (
        <div className="text-sm opacity-70">
          Enter a postcode (e.g., <b>E1 6AN</b>) and click <b>Fetch demo</b> to populate area stats and comparables.
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Median sale (12m)" value={`£${metrics.lrMedianPrice12m.toLocaleString()}`} sub={`${metrics.lrTransactions12m} transactions`} />
          <Stat label="5y price trend" value={`${metrics.priceTrend5yPct}%`} />
          <Stat label="Avg rent (2-bed)" value={`£${metrics.avgRentPm2bed.toLocaleString()}/m`} />
          <Stat label="Area gross yield" value={`${metrics.grossYieldAvgPct}%`} />
          <Stat label="EPC (avg)" value={metrics.epcAvg} />
          <Stat label="Flood risk" value={metrics.floodRisk} />
          <Stat label="Crime / 1k" value={metrics.crimePer1k} />
          <Stat
            label="Your est. yield"
            value={subjectYieldPct != null ? `${subjectYieldPct}%` : "—"}
            sub={areaYieldPct != null && deltaPct != null ? `vs area ${areaYieldPct}% (${deltaPct > 0 ? "+" : ""}${deltaPct}pp)` : undefined}
          />
        </div>
      )}

      {/* Comps */}
      {metrics && (
        <div className="grid lg:grid-cols-3 gap-4">
          <CompCard title="Sold comparables (12m)" items={sold} />
          <CompCard title="On market (for sale)" items={forsale} />
          <CompCard title="To let (monthly rent)" items={torent} />
        </div>
      )}
    </div>
  );
}

function CompCard({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">{title}</h3>
      {items.length === 0 ? (
        <div className="text-sm opacity-70">No data.</div>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{c.address}</div>
                {c.distanceKm != null && <div className="text-xs opacity-60">{c.distanceKm} km</div>}
              </div>
              <div className="text-xs opacity-70">{c.postcode} · {c.source}{c.date ? ` · ${c.date}` : ""}</div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="font-semibold">
                  {c.type === "to_rent" ? `£${c.price.toLocaleString()}/m` : `£${c.price.toLocaleString()}`}
                </span>
                {c.ppsf && <span className="text-xs opacity-70">£{c.ppsf}/sqft</span>}
                {c.epc && <span className="text-xs opacity-70">EPC {c.epc}</span>}
                {c.url && (
                  <a className="text-xs underline" href={c.url} target="_blank" rel="noreferrer">
                    Link
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
