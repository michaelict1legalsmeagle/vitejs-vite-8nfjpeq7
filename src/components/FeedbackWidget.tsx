import React, { useEffect, useMemo, useState } from "react";

type FeedbackItem = {
  id: string;
  ts: string;
  sentiment: "up" | "down" | null;
  category: "bug" | "suggestion" | "data" | "ux" | "other";
  message: string;
  email?: string;
  page: string;
  ua: string;
};

const STORAGE_KEY = "lexlot_feedback";

function getCount(): number {
  try {
    const arr: FeedbackItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [sentiment, setSentiment] = useState<FeedbackItem["sentiment"]>(null);
  const [category, setCategory] = useState<FeedbackItem["category"]>("suggestion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [thanks, setThanks] = useState("");
  const [count, setCount] = useState<number>(getCount());

  // keep count fresh
  useEffect(() => setCount(getCount()), [open, thanks]);
  useEffect(() => {
    const onStorage = () => setCount(getCount());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const submit = () => {
    const entry: FeedbackItem = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      sentiment,
      category,
      message: message.trim(),
      email: email.trim() || undefined,
      page: location.href,
      ua: navigator.userAgent,
    };
    if (!entry.message) { setThanks("Please add a short message."); return; }
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: FeedbackItem[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    setThanks("Thanks! Feedback saved ✅");
    setMessage(""); setSentiment(null);
    setTimeout(() => setThanks(""), 2000);
  };

  const exportAll = () => {
    const raw = localStorage.getItem(STORAGE_KEY) || "[]";
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lexlot-feedback-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setThanks("Cleared.");
    setCount(0);
    setTimeout(() => setThanks(""), 1200);
  };

  return (
    <>
      {/* Floating button with badge */}
      <div className="fixed z-[55] bottom-4 right-4">
        <button type="button" onClick={() => setOpen(true)} className="btn shadow-lg relative">
          💬 Feedback
          {count > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center
                             h-5 min-w-[20px] px-1 rounded-full text-[11px]
                             bg-sky-600 text-white shadow">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/30">
          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-4 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Help us improve</h3>
              <button className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>

            <div className="text-xs opacity-70 mb-3">
              We read every note. Your feedback makes LexLot better. ({count} stored locally)
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs opacity-70 mb-1">How was this session?</div>
                <div className="flex gap-2">
                  <button type="button" className={`btn ${sentiment === "up" ? "tab-active" : ""}`} onClick={() => setSentiment("up")}>👍 Good</button>
                  <button type="button" className={`btn ${sentiment === "down" ? "tab-active" : ""}`} onClick={() => setSentiment("down")}>👎 Not great</button>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs opacity-70">Category</span>
                <select
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
                  value={category}
                  onChange={(e) => setCategory(e.currentTarget.value as any)}
                >
                  <option value="suggestion">Suggestion</option>
                  <option value="data">Data accuracy</option>
                  <option value="ux">UX / usability</option>
                  <option value="bug">Bug</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs opacity-70">Message</span>
                <textarea
                  rows={5}
                  className="rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-900"
                  placeholder="What worked well? What needs improvement?"
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs opacity-70">Email (optional, for follow-up)</span>
                <input
                  type="email"
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
              </label>

              {thanks && <div className="text-xs">{thanks}</div>}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex gap-2">
                  <button className="btn tab-active" onClick={submit}>Submit</button>
                  <button className="btn" onClick={exportAll}>Export JSON</button>
                </div>
                <button className="btn" onClick={clearAll}>Clear stored</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
