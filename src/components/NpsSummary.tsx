import React, { useEffect, useMemo, useState } from "react";

type NpsRecord = {
  id: string;
  ts: string;      // ISO date
  score: number;   // 0..10
  note?: string;
  page: string;
  ua: string;
};

const NPS_KEY = "lexlot_nps_v1";

function readRecords(): NpsRecord[] {
  try {
    const raw = localStorage.getItem(NPS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return Array.isArray(obj.records) ? obj.records : [];
  } catch {
    return [];
  }
}

function exportRecords(recs: NpsRecord[]) {
  const blob = new Blob([JSON.stringify(recs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lexlot-nps-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function NpsSummary() {
  const [recs, setRecs] = useState<NpsRecord[]>([]);

  useEffect(() => {
    setRecs(readRecords());
  }, []);

  const stats = useMemo(() => {
    const total = recs.length;
    const promoters = recs.filter((r) => r.score >= 9).length;
    const passives = recs.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = recs.filter((r) => r.score <= 6).length;
    const nps = total ? Math.round(((promoters / total) - (detractors / total)) * 100) : 0;
    return { total, promoters, passives, detractors, nps };
  }, [recs]);

  const clearAll = () => {
    try {
      const raw = localStorage.getItem(NPS_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        localStorage.setItem(NPS_KEY, JSON.stringify({ ...obj, records: [] }));
      }
    } catch {}
    setRecs([]);
  };

  const refresh = () => setRecs(readRecords());

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">NPS Summary (local)</h3>
        <div className="flex gap-2">
          <button className="btn" onClick={refresh}>↻ Refresh</button>
          <button className="btn" onClick={() => exportRecords(recs)}>⬇ Export</button>
          <button className="btn" onClick={clearAll}>🗑 Clear</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <Stat label="Total" value={recs.length} />
        <Stat label="Promoters (9–10)" value={recs.filter(r => r.score >= 9).length} />
        <Stat label="Passives (7–8)" value={recs.filter(r => r.score >= 7 && r.score <= 8).length} />
        <Stat label="Detractors (0–6)" value={recs.filter(r => r.score <= 6).length} />
        <Stat label="NPS" value={
          (() => {
            const t = recs.length;
            if (!t) return 0;
            const p = recs.filter(r => r.score >= 9).length / t;
            const d = recs.filter(r => r.score <= 6).length / t;
            return Math.round((p - d) * 100);
          })()
        } />
      </div>

      <div>
        <h4 className="font-medium mb-2">Recent responses</h4>
        {recs.length === 0 && <div className="text-sm opacity-70">No responses yet.</div>}
        <ul className="space-y-2">
          {recs.slice().reverse().slice(0, 8).map((r) => (
            <li key={r.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold">Score {r.score}</div>
                <div className="opacity-70 text-xs">{new Date(r.ts).toLocaleString()}</div>
              </div>
              {r.note && <div className="mt-1 text-sm opacity-90">{r.note}</div>}
              <div className="mt-1 text-[11px] opacity-60 truncate">{r.page}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs opacity-70 mt-1">{label}</div>
    </div>
  );
}
