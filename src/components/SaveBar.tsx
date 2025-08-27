// src/components/SaveBar.tsx
import React from "react";
import { useApp } from "../store/useApp";

function toCSV(obj: Record<string, any>): string {
  const keys = Object.keys(obj);
  const vals = keys.map((k) => obj[k]);
  return [keys.join(","), vals.map((v) => JSON.stringify(v ?? "")).join(",")].join("\n");
}

export default function SaveBar() {
  const { values, scenario } = useApp((s) => ({ values: s.values, scenario: s.scenario }));
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const dl = (name: string, mime: string, data: string | Blob) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3 flex gap-2">
      <button
        className="px-3 py-1 rounded bg-black text-white"
        onClick={() => {
          const saves = JSON.parse(localStorage.getItem("saves.v1") || "[]");
          saves.push({ id: crypto.randomUUID(), when: Date.now(), scenario, values });
          localStorage.setItem("saves.v1", JSON.stringify(saves));
        }}
      >
        Save
      </button>

      <button
        className="px-3 py-1 rounded border"
        onClick={() => dl(`deal-${stamp}.json`, "application/json", JSON.stringify({ scenario, values }, null, 2))}
      >
        Export JSON
      </button>

      <button
        className="px-3 py-1 rounded border"
        onClick={() => dl(`deal-${stamp}.csv`, "text/csv", toCSV(values))}
      >
        Export CSV
      </button>

      <button
        className="px-3 py-1 rounded border"
        onClick={() => window.print()}
      >
        Export PDF
      </button>
    </div>
  );
}
