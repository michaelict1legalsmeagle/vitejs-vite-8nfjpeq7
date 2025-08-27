import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/UploadZone.tsx
import React from "react";
export default function UploadZone() {
    const inputRef = React.useRef(null);
    const [busy, setBusy] = React.useState(false);
    const [count, setCount] = React.useState(0);
    const [err, setErr] = React.useState(null);
    const safeJSON = async (r) => { try {
        return await r.json();
    }
    catch {
        return null;
    } };
    const broadcastDocsChanged = (docs, added) => {
        const detail = { added, docs };
        window.dispatchEvent(new CustomEvent("document:uploaded", { detail }));
        window.dispatchEvent(new CustomEvent("lexlot:docsChanged", { detail }));
        const latest = Array.isArray(docs) && docs.length ? docs[docs.length - 1] : null;
        if (latest?.id || latest?.docId) {
            const id = String(latest.id ?? latest.docId);
            const meta = {
                docId: id, id,
                name: latest.name, pages: latest.pages, words: latest.words,
                createdAt: latest.createdAt, size: latest.size, mime: latest.mime,
            };
            const selDetail = { id, docId: id, meta };
            window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail: selDetail }));
            window.dispatchEvent(new CustomEvent("document:selected", { detail: selDetail }));
        }
    };
    const fetchDocsIfNeeded = async (docs) => {
        if (Array.isArray(docs) && docs.length)
            return docs;
        try {
            const r = await fetch("/api/docs");
            const j = await safeJSON(r);
            return (r.ok && j && j.docs) ? j.docs : (docs ?? []);
        }
        catch {
            return docs ?? [];
        }
    };
    const sendFiles = React.useCallback(async (files) => {
        setErr(null);
        const list = Array.from(files || []).filter(Boolean);
        if (list.length === 0)
            return;
        const fd = new FormData();
        list.forEach((f) => fd.append("files", f));
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 25000);
        setBusy(true);
        try {
            const r = await fetch("/api/upload", { method: "POST", body: fd, signal: ac.signal });
            // StackBlitz stub path → seed by names
            if (r.status === 415) {
                const names = list.map((f) => f.name);
                const r2 = await fetch("/api/uploads", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ names }),
                });
                const j2 = (await safeJSON(r2));
                if (r2.ok && j2 && "ok" in j2 && j2.ok) {
                    const added = j2?.ids?.length ?? names.length;
                    const docsRaw = j2?.docs ?? [];
                    const docs = await fetchDocsIfNeeded(docsRaw);
                    setCount((c) => c + added);
                    broadcastDocsChanged(docs, added);
                    return;
                }
                const msg = (!r2.ok && `HTTP ${r2.status}`) || j2?.error || "Seed upload failed";
                setErr(`${msg} (fallback)`);
                return;
            }
            // Real backend path
            const j = (await safeJSON(r));
            if (!r.ok || !j || !("ok" in j) || !j.ok) {
                const msg = (r.status === 413 && "File too large") ||
                    (!r.ok && `HTTP ${r.status}`) ||
                    j?.error ||
                    "Upload failed";
                setErr(String(msg));
                return;
            }
            const added = j?.added ?? list.length;
            const docsRaw = j?.docs ?? [];
            const docs = await fetchDocsIfNeeded(docsRaw);
            setCount((c) => c + Number(added));
            broadcastDocsChanged(docs, Number(added));
        }
        catch (e) {
            const msg = e?.name === "AbortError" ? "Upload timed out" :
                e?.message || "Upload failed";
            setErr(msg);
        }
        finally {
            clearTimeout(to);
            setBusy(false);
        }
    }, []);
    const onPick = React.useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            void sendFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
        }
    }, [sendFiles]);
    const onDrop = React.useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy)
            return;
        const items = e.dataTransfer?.files;
        if (items && items.length > 0)
            void sendFiles(items);
    }, [busy, sendFiles]);
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Upload PDFs" }), _jsxs("div", { className: [
                    "rounded-2xl border-2 border-dashed",
                    "border-slate-300 dark:border-slate-700",
                    "p-6 text-center cursor-pointer select-none",
                    busy ? "opacity-60 pointer-events-none" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40",
                ].join(" "), onClick: () => inputRef.current?.click(), onDrop: onDrop, onDragOver: (e) => e.preventDefault(), role: "button", "aria-disabled": busy, children: [_jsxs("div", { className: "text-sm mb-1", children: ["Drag & drop PDFs here, or", " ", _jsx("span", { className: "text-primary underline", children: "choose files" })] }), _jsx("div", { className: "text-xs text-slate-500", children: "Up to 20 files" })] }), _jsx("input", { ref: inputRef, type: "file", accept: "application/pdf,.pdf", multiple: true, hidden: true, onChange: onPick }), _jsxs("div", { className: "mt-2 text-xs", "aria-live": "polite", children: [busy && _jsx("span", { className: "text-slate-500", children: "Uploading\u2026" }), !busy && err && _jsxs("span", { className: "text-red-500 font-medium", children: ["Error: ", err] }), !busy && !err && count > 0 && (_jsxs("span", { className: "text-slate-500", children: ["Uploaded ", count, " file(s)"] }))] })] }));
}
