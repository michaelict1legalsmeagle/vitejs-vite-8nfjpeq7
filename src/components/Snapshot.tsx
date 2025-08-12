import React from "react";
import { usePack } from "../store/usePack";
import ListingCard from "./ListingCard";

export default function Snapshot() {
  const analysis = usePack((s) => s.analysis);

  return (
    <div className="space-y-4">
      {/* Listing summary (auction house, guide, link) */}
      <ListingCard />

      {/* Analysis snapshot */}
      {!analysis ? (
        <p className="text-sm opacity-70">
          Click <b>Analyze</b> to generate a snapshot of issues, hidden costs, and key dates.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card">
              <div className="text-sm opacity-70">Verdict</div>
              <div className="text-lg font-semibold">{analysis.verdict}</div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">Hidden Cost (est.)</div>
              <div className="text-lg font-semibold">
                £{analysis.hiddenCostTotal.toLocaleString()}
              </div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">Auction</div>
              <div>{analysis.keyDates.auction}</div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">Completion</div>
              <div>{analysis.keyDates.completion ?? "—"}</div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Top 5 Issues</h3>
            <ul className="space-y-2">
              {analysis.topIssues.map((i) => (
                <li key={i.id} className="flex items-start gap-2">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full ${
                      i.severity === "red"
                        ? "bg-red-500"
                        : i.severity === "amber"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <div>
                    <div className="font-medium">{i.title}</div>
                    {i.note && <div className="text-xs opacity-70">{i.note}</div>}
                    {typeof i.estCost === "number" && (
                      <div className="text-xs">
                        Est. £{i.estCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
