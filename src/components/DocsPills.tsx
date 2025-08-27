// src/components/DocsPills.tsx
import React from "react";
import { useStore } from "../state";

export default function DocsPills() {
  const s = useStore();
  const [q, setQ] = React.useState("");

  const docs = s.docs.filter(d =>
    !q || d.name.toLowerCase().includes(q.toLowerCase())
  );

  const handleSelect = (docId: string) => {
    if (docId === s.selectedDocId) return; // no-op if already selected
    const meta = s.docs.find(d => d.docId === docId) || null;

    s.selectDoc(docId);

    const detail = { id: docId, docId, meta };
    // New-style event
    window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail }));
    // Legacy/back-compat event
    window.dispatchEvent(new CustomEvent("document:selected", { detail }));
  };

  return (
    <div>
      <input
        id="docs-search"
        className="input input-sm w-full mb-2"
        placeholder="Search documents…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {docs.map((d) => {
          const active = d.docId === s.selectedDocId;
          return (
            <button
              key={d.docId}
              data-docid={d.docId}
              className={`px-3 py-1 rounded-full border ${
                active ? "bg-primary text-primary-content" : "bg-base-200"
              }`}
              onClick={() => handleSelect(d.docId)}
              title={`${d.pages ?? "?"} pages • ${d.words ?? "?"} words`}
              aria-pressed={active}
            >
              {d.name}
            </button>
          );
        })}
        {!docs.length && (
          <div className="text-slate-500 text-sm">No documents yet.</div>
        )}
      </div>
    </div>
  );
}
