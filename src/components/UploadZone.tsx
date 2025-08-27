// src/components/UploadZone.tsx
import React from "react";

type UploadJSON =
  | { ok: true; added?: number; docs?: any[]; ids?: string[] }
  | { ok: false; error?: string };

export default function UploadZone() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [count, setCount] = React.useState<number>(0);
  const [err, setErr] = React.useState<string | null>(null);

  const safeJSON = async (r: Response) => { try { return await r.json(); } catch { return null; } };

  const broadcastDocsChanged = (docs: any[], added: number) => {
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

  const fetchDocsIfNeeded = async (docs?: any[]) => {
    if (Array.isArray(docs) && docs.length) return docs;
    try {
      const r = await fetch("/api/docs");
      const j = await safeJSON(r);
      return (r.ok && j && (j as any).docs) ? (j as any).docs : (docs ?? []);
    } catch {
      return docs ?? [];
    }
  };

  const sendFiles = React.useCallback(async (files: FileList | File[]) => {
    setErr(null);
    const list = Array.from(files || []).filter(Boolean);
    if (list.length === 0) return;

    const fd = new FormData();
    list.forEach((f) => fd.append("files", f));

    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 25_000);

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
        const j2 = (await safeJSON(r2)) as UploadJSON | null;
        if (r2.ok && j2 && "ok" in j2 && j2.ok) {
          const added = (j2 as any)?.ids?.length ?? names.length;
          const docsRaw = (j2 as any)?.docs ?? [];
          const docs = await fetchDocsIfNeeded(docsRaw);
          setCount((c) => c + added);
          broadcastDocsChanged(docs, added);
          return;
        }
        const msg = (!r2.ok && `HTTP ${r2.status}`) || (j2 as any)?.error || "Seed upload failed";
        setErr(`${msg} (fallback)`);
        return;
      }

      // Real backend path
      const j = (await safeJSON(r)) as UploadJSON | null;
      if (!r.ok || !j || !("ok" in j) || !j.ok) {
        const msg =
          (r.status === 413 && "File too large") ||
          (!r.ok && `HTTP ${r.status}`) ||
          (j as any)?.error ||
          "Upload failed";
        setErr(String(msg));
        return;
      }

      const added = (j as any)?.added ?? list.length;
      const docsRaw = (j as any)?.docs ?? [];
      const docs = await fetchDocsIfNeeded(docsRaw);

      setCount((c) => c + Number(added));
      broadcastDocsChanged(docs, Number(added));
    } catch (e: any) {
      const msg =
        e?.name === "AbortError" ? "Upload timed out" :
        e?.message || "Upload failed";
      setErr(msg);
    } finally {
      clearTimeout(to);
      setBusy(false);
    }
  }, []);

  const onPick = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void sendFiles(e.target.files);
      e.target.value = ""; // allow re-selecting the same file
    }
  }, [sendFiles]);

  const onDrop = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const items = e.dataTransfer?.files;
    if (items && items.length > 0) void sendFiles(items);
  }, [busy, sendFiles]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Upload PDFs</h3>

      <div
        className={[
          "rounded-2xl border-2 border-dashed",
          "border-slate-300 dark:border-slate-700",
          "p-6 text-center cursor-pointer select-none",
          busy ? "opacity-60 pointer-events-none" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40",
        ].join(" ")}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        aria-disabled={busy}
      >
        <div className="text-sm mb-1">
          Drag & drop PDFs here, or{" "}
          <span className="text-primary underline">choose files</span>
        </div>
        <div className="text-xs text-slate-500">Up to 20 files</div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={onPick}
      />

      <div className="mt-2 text-xs" aria-live="polite">
        {busy && <span className="text-slate-500">Uploading…</span>}
        {!busy && err && <span className="text-red-500 font-medium">Error: {err}</span>}
        {!busy && !err && count > 0 && (
          <span className="text-slate-500">Uploaded {count} file(s)</span>
        )}
      </div>
    </div>
  );
}
