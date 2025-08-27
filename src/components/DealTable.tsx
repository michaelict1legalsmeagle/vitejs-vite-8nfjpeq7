import React from "react";
import { useDeals } from "@/store/useSavedDeals";
import { downloadCSV } from "@/lib/csv"; // already in your repo

export default function DealTable() {
  const { items, clear, remove, rename } = useDeals();

  function exportCsv() {
    const rows = items.map((d) => ({
      id: d.id,
      name: d.name,
      score: d.score ?? "",
      overall: d.overall ?? "",
      created: new Date(d.createdAt).toISOString(),
    }));
    const csv = toCsv(rows);
    downloadCSV(csv, "saved_deals.csv");
  }

  return (
    <section className="rounded-xl border bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">Saved Deals</div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="rounded border px-3 py-1.5 text-xs hover:bg-slate-50"
            title="Export CSV"
          >
            Export CSV
          </button>
          <button
            onClick={clear}
            className="rounded border px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
            title="Clear all"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="border-t overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Name</Th>
              <Th>Score</Th>
              <Th>Overall</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No saved deals yet — add inputs, then use the Save box above.
                </td>
              </tr>
            ) : (
              items.map((d) => <Row key={d.id} d={d} onRemove={() => remove(d.id)} onRename={(n) => rename(d.id, n)} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* helpers */

function Row({
  d,
  onRemove,
  onRename,
}: {
  d: {
    id: string;
    name: string;
    createdAt: number;
    score?: number;
    overall?: "GREEN" | "AMBER" | "RED";
  };
  onRemove: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(d.name);

  function saveName() {
    const n = val.trim() || d.name;
    onRename(n);
    setEditing(false);
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2">
        {editing ? (
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="w-full rounded border px-2 py-1 text-sm"
            autoFocus
          />
        ) : (
          <button
            className="text-left hover:underline"
            onClick={() => setEditing(true)}
            title="Rename"
          >
            {d.name}
          </button>
        )}
      </td>
      <td className="px-4 py-2">{typeof d.score === "number" ? d.score : "—"}</td>
      <td className="px-4 py-2">
        {d.overall ? (
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              d.overall === "GREEN"
                ? "bg-green-100 text-green-800"
                : d.overall === "AMBER"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {d.overall}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-2">{new Date(d.createdAt).toLocaleString()}</td>
      <td className="px-4 py-2 text-right">
        <button
          onClick={onRemove}
          className="rounded border px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
          title="Delete"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-4 py-2 text-left font-medium ${className}`}>{children}</th>;
}

function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return "id,name,score,overall,created\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => {
          const v = r[h] ?? "";
          const needsQuote = /[",\n]/.test(String(v));
          return needsQuote ? `"${String(v).replace(/"/g, '""')}"` : String(v);
        })
        .join(",")
    );
  }
  return lines.join("\n");
}
