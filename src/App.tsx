import React, { useCallback, useState } from "react";
import Snapshot from "./components/Snapshot";
import DeepDive from "./components/DeepDive";
import InvestorMetrics from "./components/InvestorMetrics";
import RawJson from "./components/RawJson";
import UploadZone from "./components/UploadZone";
import ExtractPanel from "./components/ExtractPanel";
import { usePack } from "./store/usePack";
import Disclaimer from "./components/Disclaimer";
import FeedbackWidget from "./components/FeedbackWidget";
import NpsPulse from "./components/NpsPulse";
import Toast from "./components/Toast";
import AreaComps from "./components/AreaComps";

type TabKey = "snapshot" | "deepdive" | "metrics" | "area" | "json";

export default function App() {
  const [tab, setTab] = useState<TabKey>("snapshot");

  const { loadMock, reset } = usePack();
  const clearFiles = usePack((s) => s.clearFiles);
  const runLocalExtraction = usePack((s) => s.runLocalExtraction);
  const analysis = usePack((s) => s.analysis);
  const listing = usePack((s) => s.listing);

  const scrollToUpload = useCallback(() => {
    document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!listing) {
      runLocalExtraction({
        contextText:
          "Savills Auctions — Lot 17: Example Flat. Guide Price: £160,000–£180,000 (plus fees). Auction: 2025-09-10. View lot: https://auctions.savills.com/lot/12345",
        sourceUrls: ["https://auctions.savills.com/lot/12345"],
        lotMetadata: { lot_number: "17", auction_event_date: "2025-09-10" },
      });
    }
    loadMock();
  }, [listing, runLocalExtraction, loadMock]);

  const handleClear = useCallback(() => {
    reset();
    clearFiles?.();
  }, [reset, clearFiles]);

  const exportJson = useCallback(() => {
    const payload = { listing, analysis };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lexlot-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);

    window.dispatchEvent(new Event("lexlot:export"));
    window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Exported ✓" } }));
  }, [listing, analysis]);

  return (
    <div className="min-h-screen">
      <Disclaimer />

      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
          <h1 className="text-2xl font-bold">LexLot</h1>
          <div className="flex gap-2">
            <button className="btn" onClick={scrollToUpload}>📂 Upload Pack</button>
            <button className="btn" onClick={handleAnalyze}>⚡ Analyze</button>
            <button className="btn" onClick={handleClear}>🧹 Clear</button>
            <button className="btn" onClick={exportJson}>📤 Export JSON</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid md:grid-cols-[300px_1fr] gap-4">
        <aside className="card space-y-4">
          <UploadZone />
          <ExtractPanel />
          <div>
            <h2 className="font-semibold mt-2 mb-2">Documents</h2>
            <ul className="text-sm space-y-1">
              <li>• Special Conditions of Sale</li>
              <li>• Addendum</li>
              <li>• Contract</li>
              <li>• Title (OC1) &amp; Plan</li>
              <li>• Leases / ASTs</li>
            </ul>
            <h2 className="font-semibold mt-4 mb-2">Lot Details</h2>
            <div className="text-sm space-y-1">
              <div>Jurisdiction: <b>England &amp; Wales</b></div>
              <div>Tenure: <b>—</b></div>
            </div>
          </div>
        </aside>

        <section className="card">
          <div className="flex flex-wrap gap-2 mb-4">
            <TabButton label="Snapshot" active={tab === "snapshot"} onClick={() => setTab("snapshot")} />
            <TabButton label="Deep Dive" active={tab === "deepdive"} onClick={() => setTab("deepdive")} />
            <TabButton label="Investor Metrics" active={tab === "metrics"} onClick={() => setTab("metrics")} />
            <TabButton label="Area & Comps" active={tab === "area"} onClick={() => setTab("area")} />
            <TabButton label="Raw JSON" active={tab === "json"} onClick={() => setTab("json")} />
          </div>

          {tab === "snapshot" && <Snapshot />}
          {tab === "deepdive" && <DeepDive />}
          {tab === "metrics" && <InvestorMetrics />}
          {tab === "area" && <AreaComps />}
          {tab === "json" && <RawJson />}
        </section>
      </main>

      <FeedbackWidget />
      <NpsPulse />
      <Toast />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`btn ${active ? "tab-active" : ""}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}
