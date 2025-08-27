import React from "react";
import {
  audit,
  docs as fetchDocs,
  type AuditFinding,
  type DocMeta,
} from "../lib/api";

function severityClass(s: string): string {
  const k = (s || "").toLowerCase();
  if (k === "high") return "badge-high";
  if (k === "medium") return "badge-medium";
  if (k === "low") return "badge-low";
  return "text-xs px-2 py-0.5 rounded bg-slate-600 text-white";
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z" />
    </svg>
  );
}

export default function AuditPanel() {
  const [options, setOptions] = React.useState<DocMeta[]>([]);
  const [docId, setDocId] = React.useState<string | null>(null);
  const [docName, setDocName] = React.useState<string | null>(null);

  const [risk, setRisk] = React.useState<"high" | "medium" | "low">("high");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string>("");

  const [findings, setFindings] = React.useState<AuditFinding[]>([]);
  const [totalScore, setTotalScore] = React.useState<number>(0);

  // ---- fetch docs & keep current selection when possible
  const refreshDocs = React.useCallback(async () => {
    const list = await fetchDocs(); // returns DocMeta[] with docId
    const arr: DocMeta[] = Array.isArray(list) ? [...list] : [];
    arr.sort(
      (a, b) =>
        ((b.createdAt ?? 0) - (a.createdAt ?? 0)) ||
        a.name.localeCompare(b.name)
    );
    setOptions(arr);

    if (arr.length === 0) {
      setDocId(null);
      setDocName(null);
      return;
    }
    const stillExists = docId && arr.some(d => d.docId === docId);
    const nextId = stillExists ? (docId as string) : arr[0].docId;
    setDocId(nextId);
    setDocName(arr.find(d => d.docId === nextId)?.name ?? null);
  }, [docId]);

  React.useEffect(() => { void refreshDocs(); }, [refreshDocs]);

  // ---- react to external selection events from pills
  React.useEffect(() => {
    const onSelect = (e: Event) => {
      const detail: any = (e as CustomEvent).detail ?? {};
      const id: string | null = detail.docId ?? detail.id ?? null;
      if (!id) return;
      const meta: DocMeta | undefined =
        detail.meta || options.find(o => o.docId === id);

      setDocId(id);
      setDocName(meta?.name || null);
      setFindings([]);
      setErr(null);
      setFeedback("");
      setTotalScore(0);
    };

    window.addEventListener("document:selected", onSelect as EventListener);
    window.addEventListener("lexlot:docSelected", onSelect as EventListener);
    return () => {
      window.removeEventListener("document:selected", onSelect as EventListener);
      window.removeEventListener("lexlot:docSelected", onSelect as EventListener);
    };
  }, [options]);

  // ---- refresh options on upload events
  React.useEffect(() => {
    const onUploaded = () => void refreshDocs();
    window.addEventListener("document:uploaded", onUploaded as EventListener);
    window.addEventListener("lexlot:docsChanged", onUploaded as EventListener);
    return () => {
      window.removeEventListener("document:uploaded", onUploaded as EventListener);
      window.removeEventListener("lexlot:docsChanged", onUploaded as EventListener);
    };
  }, [refreshDocs]);

  const handlePick = (id: string) => {
    const meta = options.find(o => o.docId === id) || null;
    setDocId(id || null);
    setDocName(meta?.name || null);
    setFindings([]);
    setErr(null);
    setFeedback("");
    setTotalScore(0);

    const detail = { id, docId: id, meta };
    window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail }));
    window.dispatchEvent(new CustomEvent("document:selected", { detail }));
  };

  const runAudit = async () => {
    setErr(null);
    setFindings([]);
    setTotalScore(0);
    setFeedback("");

    const id = docId ?? options[0]?.docId;
    if (!id) {
      setErr("No documents available. Upload a PDF first.");
      return;
    }

    try {
      setLoading(true);
      const res = await audit(id, risk);
      setFindings(res.findings || []);
      setTotalScore(res.totalScore || 0);
      setFeedback(`Audit complete — ${(res.findings?.length ?? 0)} finding(s).`);
      window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Audit complete ✓" } }));
    } catch (e: any) {
      setErr(e?.message || "Audit failed");
      setFeedback("");
    } finally {
      setLoading(false);
    }
  };

  const selectId = "audit-doc-select";
  const currentId =
    docId && options.some((o) => o.docId === docId)
      ? docId
      : (options[0]?.docId || "");

  // visible-but-disabled style (keeps blue button present)
  const btnState =
    loading || !currentId
      ? "opacity-90 ring-1 ring-primary/30"
      : "hover:brightness-110";

  const pin = (snippet?: string) => {
    if (!snippet) return;
    window.dispatchEvent(new CustomEvent("lexlot:pinEvidence", { detail: { snippet } }));
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">Risk &amp; Conditions Audit</div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor={selectId} className="text-sm">Doc:</label>
            <select
              id={selectId}
              className="relative z-10 pointer-events-auto ml-0 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-2 py-1 min-w-[14rem]"
              value={currentId}
              onChange={(e) => handlePick(e.target.value)}
            >
              {options.length === 0 && <option value="">No documents</option>}
              {options.map((d) => (
                <option key={d.docId} value={d.docId}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <label className="text-sm">
            Risk:
            <select
              className="ml-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-2 py-1"
              value={risk}
              onChange={(e) => setRisk(e.target.value as any)}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          {/* Primary blue action + hotkey target, always visibly blue */}
          <button
            id="audit-run"
            data-action="run-audit"
            data-hotkey="Mod+Enter"
            className={`btn btn-primary gap-2 ${btnState}`}
            onClick={runAudit}
            disabled={loading || !currentId}
            aria-disabled={loading || !currentId}
            aria-busy={loading}
            title="Run Audit (⌘/Ctrl+Enter)"
          >
            {loading ? <Spinner /> : null}
            {loading ? "Running…" : "Run Audit"}
          </button>
        </div>
      </div>

      {/* live status line */}
      <div className="text-xs" aria-live="polite">
        {err ? (
          <span className="text-red-600 dark:text-red-400">{err}</span>
        ) : currentId ? (
          <span className="text-slate-600 dark:text-slate-300">
            Using: <b>{docName || currentId}</b> · Total Score: <b>{totalScore}</b> · Findings: <b>{findings.length}</b>
            {feedback ? <> — {feedback}</> : null}
          </span>
        ) : (
          <span className="text-slate-500">No document selected.</span>
        )}
      </div>

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/40">
            <tr>
              <th className="text-left p-2">Severity</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Issue</th>
              <th className="text-left p-2">Excerpt</th>
              <th className="text-right p-2">Score</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f, i) => {
              const sev = (f as any).severity || (f as any).risk;
              const cat = (f as any).category ?? "";
              const issue = (f as any).issue ?? (f as any).title ?? "";
              const snip = (f as any).snippet ?? (f as any).where?.snippet ?? "";
              const sc = (f as any).score ?? "";
              return (
                <tr key={i} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="p-2">
                    <span className={severityClass(sev)}>{sev}</span>
                  </td>
                  <td className="p-2">{cat}</td>
                  <td className="p-2">{issue}</td>
                  <td className="p-2">
                    <code className="text-xs whitespace-pre-wrap break-words">{snip}</code>
                  </td>
                  <td className="p-2 text-right">{sc}</td>
                  <td className="p-2 text-right">
                    {snip ? (
                      <button className="btn btn-ghost btn-xs" onClick={() => pin(snip)}>
                        Pin evidence
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {findings.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-xs text-slate-500">
                  No findings yet. Choose a doc &amp; risk level, then click “Run Audit”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
