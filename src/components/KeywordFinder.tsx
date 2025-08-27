// src/components/KeywordFinder.tsx
import React from "react";
import { useStore } from "../state";

type Match = {
  page: number;
  before: string;
  match: string;
  after: string;
  index: number;
};
type FindJSON =
  | { ok: true; total: number; matches: Match[] }
  | { ok: false; total?: number; matches?: Match[] };

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function KeywordFinder() {
  const s = useStore();
  const [q, setQ] = React.useState("");
  const dq = useDebounced(q, 200);

  const [docId, setDocId] = React.useState<string | null>(s.selectedDocId || null);
  const [hits, setHits] = React.useState<Match[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // stay in sync with Pills / external selection
  React.useEffect(() => setDocId(s.selectedDocId || null), [s.selectedDocId]);
  React.useEffect(() => {
    const onSel = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const id = d.id || d.docId || null;
      if (id) setDocId(String(id));
    };
    window.addEventListener("lexlot:docSelected", onSel as EventListener);
    window.addEventListener("document:selected", onSel as EventListener);
    return () => {
      window.removeEventListener("lexlot:docSelected", onSel as EventListener);
      window.removeEventListener("document:selected", onSel as EventListener);
    };
  }, []);

  const find = React.useCallback(async () => {
    setErr(null);
    setHits([]);
    if (!docId) {
      setErr("Select a document first.");
      return;
    }
    const query = dq.trim();
    if (!query) return;

    setBusy(true);
    try {
      const u = new URL("/api/find", window.location.origin);
      u.searchParams.set("docId", docId);
      u.searchParams.set("q", query);
      const r = await fetch(u.toString());
      const j = (await r.json()) as FindJSON;
      if (!r.ok || !("ok" in j) || !j.ok) {
        setErr(`Find failed${!r.ok ? ` (HTTP ${r.status})` : ""}`);
        return;
      }
      setHits(j.matches || []);
    } catch (e: any) {
      setErr(e?.message || "Find failed");
    } finally {
      setBusy(false);
    }
  }, [docId, dq]);

  // auto-find as the query settles or doc changes
  React.useEffect(() => { void find(); }, [find]);

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm opacity-80">Keyword Finder</div>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => { setQ(""); setHits([]); setErr(null); }}
          title="Reset"
        >
          Reset
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="finder-input"
          className="input input-sm w-full"
          placeholder="Type a word or phrase, then Enter…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void find(); }}
          spellCheck={false}
        />
        <button className="btn btn-sm" onClick={() => void find()} disabled={busy || !docId}>
          {busy ? "…" : "Find"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => window.dispatchEvent(new Event("lexlot:docsChanged"))}>
          Refresh
        </button>
      </div>

      <div className="text-xs text-slate-400" aria-live="polite">
        Doc: <b>{docId ? docId : "—"}</b> · Hits: <b>{hits.length}</b>
        {err ? <span className="text-red-400"> — {err}</span> : null}
      </div>

      <div className="border rounded p-2 max-h-64 overflow-auto text-sm">
        {hits.length === 0 ? (
          <div className="text-slate-400">No matches found.</div>
        ) : (
          <ul className="space-y-2">
            {hits.map((m, i) => (
              <li key={`${m.index}-${i}`} className="leading-relaxed">
                <span className="text-slate-400 mr-2">p.{m.page}</span>
                <code className="text-xs">
                  <span className="opacity-70">{m.before}</span>
                  <mark className="px-0.5 rounded">{m.match}</mark>
                  <span className="opacity-70">{m.after}</span>
                </code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
