import React, { useEffect, useState } from "react";

type ToastDetail = { message: string; duration?: number };
const EVT = "lexlot:toast";

export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let t: any;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail || { message: "" };
      setMsg(detail.message || "");
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), detail.duration ?? 1800);
    };
    window.addEventListener(EVT, onToast as EventListener);
    return () => {
      window.removeEventListener(EVT, onToast as EventListener);
      clearTimeout(t);
    };
  }, []);

  if (!msg) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-lg px-4 py-2 text-sm">
        {msg}
      </div>
    </div>
  );
}

// helper (optional): window.dispatchEvent(new CustomEvent('lexlot:toast', { detail: { message: 'Exported ✓' } }))
