// src/components/ChecklistPanel.tsx
import React from "react";
import { useStore } from "../state";
import { checklist as runChecklist, type ChecklistItem } from "../lib/api";

function Chip({ s }: { s: "PASS" | "FLAG" | "MISS" }) {
  const cls =
    s === "PASS" ? "bg-emerald-600 text-white" :
    s === "FLAG" ? "bg-amber-500 text-white" :
                   "bg-slate-600 text-white";
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{s}</span>;
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z"/>
    </svg>
  );
}

export default function ChecklistPanel() {
  const s = useStore();
  const selectedId = s.selectedDocId || "";

  const [rows, setRows] = React.useState<ChecklistItem[]>([]);
  const [score, setScore] = React.useState<number>(0);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string>("");

  // prevent overlapping runs
  const inFlight = React.useRef(false);

  const run = React.useCallback(async (docIdParam?: string) => {
    const docId = docIdParam || selectedId;
    if (!docId) { setErr("Select a document first."); return; }
    if (inFlight.current) return;

    inFlight.current = true;
    setErr(null);
    setFeedback("");
    setBusy(true);

    try {
      const out = await runChecklist(docId);
      setRows(out.items || []);
      setScore(out.score || 0);
      setFeedback("Checklist complete ✓");
      window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Checklist complete ✓" } }));
    } catch (e: any) {
      setErr(e?.message || "Checklist failed");
      setFeedback("");
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }, [selectedId]);

  // Auto‑run when switching docs via store
  React.useEffect(() => {
    if (selectedId) run(selectedId);
  }, [selectedId, run]);

  // Also listen to broadcast events so panels stay in sync even without the store
  React.useEffect(() => {
    const onSelect = (e: Event) => {
      const detail: any = (e as CustomEvent).detail ?? {};
      const id: string | null = detail.docId ?? detail.id ?? null;
      if (id) run(id);
    };
    window.addEventListener("lexlot:docSelected", onSelect as EventListener);
    window.addEventListener("document:selected", onSelect as EventListener);
    return () => {
      window.removeEventListener("lexlot:docSelected", onSelect as EventListener);
      window.removeEventListener("document:selected", onSelect as EventListener);
    };
  }, [run]);

  const counts = React.useMemo(() => {
    const c = { PASS: 0, FLAG: 0, MISS: 0 } as Record<ChecklistItem["status"], number>;
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  const pin = (snippet?: string) => {
    if (!snippet) return;
    window.dispatchEvent(new CustomEvent("lexlot:pinEvidence", { detail: { snippet } }));
  };

  // Visibly active state even when disabled
  const btnState =
    busy || !selectedId
      ? "opacity-90 ring-1 ring-accent/30"
      : "hover:brightness-110";

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pack Checklist</h3>
        <div className="flex items-center gap-2">
          <span className="badge badge-outline">Score: {score}</span>
          <button
            className={`btn btn-accent btn-sm gap-2 ${btnState}`}
            onClick={() => run()}
            disabled={busy || !selectedId}
            aria-disabled={busy || !selectedId}
            aria-busy={busy}
            title="Re-run Checklist"
          >
            {busy ? <Spinner /> : null}
            {busy ? "Checking…" : "Re‑run"}
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-300" aria-live="polite">
        {rows.length > 0 ? (
          <>
            <b>{counts.PASS}</b> pass · <b>{counts.FLAG}</b> flag · <b>{counts.MISS}</b> miss
            {feedback ? <> — {feedback}</> : null}
          </>
        ) : (
          <>Detects core docs (Title, Contracts, Searches, EPC, Leasehold, Tenancy, Planning, Addenda).</>
        )}
      </div>

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/40">
            <tr>
              <th className="text-left p-2 w-40">Item</th>
              <th className="text-left p-2 w-24">Status</th>
              <th className="text-left p-2 w-24">Score</th>
              <th className="text-left p-2">Evidence</th>
              <th className="text-right p-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.itemId} className="border-t border-slate-200 dark:border-slate-800 align-top">
                <td className="p-2">{r.label}</td>
                <td className="p-2"><Chip s={r.status} /></td>
                <td className="p-2">{r.score}%</td>
                <td className="p-2">
                  {r.evidence ? (
                    <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {r.evidence}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs">—</span>
                  )}
                </td>
                <td className="p-2 text-right">
                  {r.evidence ? (
                    <button className="btn btn-ghost btn-xs" onClick={() => pin(r.evidence!)}>
                      Pin evidence
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !busy && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-xs text-slate-500">
                  No results yet. Click “Re‑run”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {err && <div className="text-xs text-red-600 dark:text-red-400">{err}</div>}
    </div>
  );
}
