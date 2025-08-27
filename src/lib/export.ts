// src/lib/export.ts
// Tiny CSV helpers used by SaveBar.

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Escape double quotes and wrap in quotes if we have commas, quotes, or newlines.
  const needsWrap = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

/** Convert an array of plain objects into CSV text. */
export function toCSV(rows: Array<Record<string, any>>): string {
  if (!rows || rows.length === 0) return "";
  // Stable header set: union of all keys, stable order
  const headerSet = new Set<string>();
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const lines = [
    headers.map(csvEscape).join(","), // header line
    ...rows.map((r) => headers.map((h) => csvEscape(r?.[h])).join(",")),
  ];
  return lines.join("\n");
}

/** Trigger a CSV download in the browser. */
export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
