import React, { useRef, useState } from "react";
import { usePack } from "../store/usePack";

export default function UploadZone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { files, setFiles, clearFiles } = usePack();
  const [error, setError] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);

  const onBrowse = () => inputRef.current?.click();

  const acceptAndSet = (list: FileList | null) => {
    setError(null);
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);

    // Only PDFs
    const pdfs = incoming.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const rejects = incoming.filter((f) => !pdfs.includes(f));
    if (rejects.length) setError(`Ignored ${rejects.length} non-PDF file(s). Only PDFs are accepted.`);

    // Append + de-dupe by name+size
    const key = (f: File) => `${f.name}__${f.size}`;
    const next = [...files, ...pdfs];
    const deduped = Array.from(new Map(next.map(f => [key(f), f])).values());

    setFiles(deduped);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    acceptAndSet(e.dataTransfer.files);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const formatBytes = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)} MB` :
    n >= 1_000 ? `${(n / 1_000).toFixed(1)} KB` :
    `${n} B`;

  return (
    <div className="space-y-3" id="upload-zone">
      <div
        onClick={onBrowse}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition
          ${isOver ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20" : "border-slate-300 dark:border-slate-700"}`}
        title="Click to browse, or drag & drop PDFs here"
      >
        <div className="font-medium mb-1">Upload Pack (PDF)</div>
        <div className="text-xs opacity-70">Drag & drop one or more PDFs, or click to choose files</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => acceptAndSet(e.currentTarget.files)}
        />
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Selected files ({files.length})</div>
            <button type="button" className="btn" onClick={clearFiles}>Clear</button>
          </div>
          <ul className="text-xs space-y-1 max-h-40 overflow-auto">
            {files.map((f, i) => (
              <li key={`${f.name}-${f.size}-${i}`} className="flex justify-between border-b border-slate-200/60 dark:border-slate-800/60 py-1">
                <span className="truncate">{f.name}</span>
                <span className="opacity-70">{formatBytes(f.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
