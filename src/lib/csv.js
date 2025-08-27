export function toCSV(rows) {
    if (!rows.length)
        return "";
    const headers = Object.keys(rows[0]);
    const esc = (v) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = rows.map(r => headers.map(h => esc(r[h])).join(",")).join("\n");
    return headers.join(",") + "\n" + body;
}
export function downloadCSV(csv, filename = "export.csv") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
