import React from "react";
import * as api from "../lib/api";

type DocRec = { id: string; name: string };

const LS_KEY = "lexlot:selectedDocId";

export default function DocumentInsights() {
  const [docs, setDocs] = React.useState<DocRec[]>([]);
  const [selected, setSelected] = React.useState<string | null>(
    () => localStorage.getItem(LS_KEY)
  );
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const list = await api.docs();
      const slim = list.map((d) => ({ id: d.id, name: d.name }));
      setDocs(slim);

      if (slim.length) {
        const keep = slim.find((d) => d.id === selected)?.id ?? slim[0].id;
        if (keep !== selected) {
          setSelected(keep);
          localStorage.setItem(LS_KEY, keep);
        }
        const meta = slim.find((d) => d.id === keep);
        window.dispatchEvent(new CustomEvent("document:selected", { detail: { id: keep, meta } }));
        window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail: { docId: keep, meta } }));
      } else {
        setSelected(null);
        localStorage.removeItem(LS_KEY);
      }
    } finally {
      setBusy(false);
    }
  }, [selected]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const again = () => load();
    window.addEventListener("document:uploaded", again);
    window.addEventListener("lexlot:docsChanged", again);
    return () => {
      window.removeEventListener("document:uploaded", again);
      window.removeEventListener("lexlot:docsChanged", again);
    };
  }, [load]);

  const choose = (id: string) => {
    setSelected(id);
    localStorage.setItem(LS_KEY, id);
    const meta = docs.find((d) => d.id === id);
    window.dispatchEvent(new CustomEvent("document:selected", { detail: { id, meta } }));
    window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail: { docId: id, meta } }));
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold mb-2">Documents</h3>
        <button className="btn btn-sm" onClick={load} disabled={busy}>
          {busy ? "…" : "Refresh"}
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="text-sm text-slate-500">No documents yet. Upload PDFs above.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {docs.map((d) => {
            const active = d.id === selected;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => choose(d.id)}
                className={`px-2 py-1 rounded-full border text-sm ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={d.name}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="text-xs text-slate-500 mt-2">
          Selected: <b>{docs.find((d) => d.id === selected)?.name ?? selected}</b>
        </div>
      )}
    </div>
  );
}
