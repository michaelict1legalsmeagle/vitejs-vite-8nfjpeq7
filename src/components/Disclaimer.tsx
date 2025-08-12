import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "lexlot_disclaimer_v1_accepted";

export default function Disclaimer({ forceOpen = false }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY) === "1";
    if (forceOpen) setOpen(true);
    else if (!accepted) setOpen(true);
  }, [forceOpen]);

  // Focus trap + ESC close
  useEffect(() => {
    if (!open) return;

    lastFocused.current = (document.activeElement as HTMLElement) || null;

    // focus first focusable in modal
    const focusables = () =>
      (modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) ?? []) as unknown as HTMLElement[];

    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const items = Array.from(focusables());
        if (items.length === 0) return;
        const idx = items.indexOf(document.activeElement as HTMLElement);
        let next = idx;
        if (e.shiftKey) next = idx <= 0 ? items.length - 1 : idx - 1;
        else next = idx === items.length - 1 ? 0 : idx + 1;
        items[next].focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // restore focus on close
  useEffect(() => {
    if (!open) lastFocused.current?.focus();
  }, [open]);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <>
      {/* Sticky banner above header */}
      <div className="sticky top-0 z-20 w-full text-center text-xs py-1 px-2 bg-amber-50 text-amber-900 border-b border-amber-200">
        ⚠️ Informational only — not financial/legal/tax advice.{" "}
        <button className="underline hover:opacity-80" onClick={() => setOpen(true)} type="button">
          Read disclaimer
        </button>
        <span className="mx-1">·</span>
        <button
          className="underline hover:opacity-80"
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setOpen(true); }}
          type="button" title="Show again next time"
        >
          Reset
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" aria-hidden={false}>
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Important information & risk disclosure"
            className="max-w-xl w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Important information & risk disclosure</h3>
              <div className="text-sm leading-relaxed space-y-2 opacity-90">
                <p>
                  LexLot provides automated analysis of documents you upload for information only.
                  It is <b>not</b> financial, legal, or tax advice, and outputs may be incomplete or inaccurate.
                  Do not rely solely on this tool.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We do not advise whether to buy or bid.</li>
                  <li>Confirm all fees (buyer’s premium, admin, ground rent, service charges) in the originals.</li>
                  <li>Property values/rents can fall as well as rise; your capital is at risk.</li>
                  <li>Obtain independent legal, mortgage/financial and tax advice before acting.</li>
                </ul>
                <p className="text-xs opacity-70">
                  By continuing you accept our Terms & Privacy and agree to use LexLot as a supplementary tool only.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn" onClick={() => setOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn tab-active" onClick={accept} type="button">
                  I understand & agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
