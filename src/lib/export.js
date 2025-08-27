// src/lib/export.ts
// Tiny CSV builder + download helper (no deps)
function escapeCSV(v) {
    if (v === null || v === undefined)
        return "";
    const s = String(v);
    // Quote if contains comma, quote, or newline
    if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}
export function toCSV(rows, headers) {
    if (!rows.length)
        return "";
    const cols = headers ?? Object.keys(rows[0] ?? {});
    const head = cols.join(",");
    const body = rows
        .map((r) => cols.map((c) => escapeCSV(r[c])).join(","))
        .join("\n");
    return `${head}\n${body}\n`;
}
export function downloadCSV(filename, csv) {
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
