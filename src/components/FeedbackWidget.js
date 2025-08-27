import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
const STORAGE_KEY = "lexlot_feedback";
function getCount() {
    try {
        const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(arr) ? arr.length : 0;
    }
    catch {
        return 0;
    }
}
export default function FeedbackWidget() {
    const [open, setOpen] = useState(false);
    const [sentiment, setSentiment] = useState(null);
    const [category, setCategory] = useState("suggestion");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [thanks, setThanks] = useState("");
    const [count, setCount] = useState(getCount());
    // keep count fresh
    useEffect(() => setCount(getCount()), [open, thanks]);
    useEffect(() => {
        const onStorage = () => setCount(getCount());
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    const submit = () => {
        const entry = {
            id: crypto.randomUUID(),
            ts: new Date().toISOString(),
            sentiment,
            category,
            message: message.trim(),
            email: email.trim() || undefined,
            page: location.href,
            ua: navigator.userAgent,
        };
        if (!entry.message) {
            setThanks("Please add a short message.");
            return;
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        setThanks("Thanks! Feedback saved ✅");
        setMessage("");
        setSentiment(null);
        setTimeout(() => setThanks(""), 2000);
    };
    const exportAll = () => {
        const raw = localStorage.getItem(STORAGE_KEY) || "[]";
        const blob = new Blob([raw], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lexlot-feedback-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    const clearAll = () => {
        localStorage.removeItem(STORAGE_KEY);
        setThanks("Cleared.");
        setCount(0);
        setTimeout(() => setThanks(""), 1200);
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed z-[55] bottom-4 right-4", children: _jsxs("button", { type: "button", onClick: () => setOpen(true), className: "btn shadow-lg relative", children: ["\uD83D\uDCAC Feedback", count > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 inline-flex items-center justify-center\n                             h-5 min-w-[20px] px-1 rounded-full text-[11px]\n                             bg-sky-600 text-white shadow", children: count > 99 ? "99+" : count }))] }) }), open && (_jsx("div", { className: "fixed inset-0 z-[60] bg-black/30", children: _jsxs("div", { className: "absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-4 overflow-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Help us improve" }), _jsx("button", { className: "btn", onClick: () => setOpen(false), children: "Close" })] }), _jsxs("div", { className: "text-xs opacity-70 mb-3", children: ["We read every note. Your feedback makes LexLot better. (", count, " stored locally)"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs opacity-70 mb-1", children: "How was this session?" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: `btn ${sentiment === "up" ? "tab-active" : ""}`, onClick: () => setSentiment("up"), children: "\uD83D\uDC4D Good" }), _jsx("button", { type: "button", className: `btn ${sentiment === "down" ? "tab-active" : ""}`, onClick: () => setSentiment("down"), children: "\uD83D\uDC4E Not great" })] })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs opacity-70", children: "Category" }), _jsxs("select", { className: "rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900", value: category, onChange: (e) => setCategory(e.currentTarget.value), children: [_jsx("option", { value: "suggestion", children: "Suggestion" }), _jsx("option", { value: "data", children: "Data accuracy" }), _jsx("option", { value: "ux", children: "UX / usability" }), _jsx("option", { value: "bug", children: "Bug" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs opacity-70", children: "Message" }), _jsx("textarea", { rows: 5, className: "rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-900", placeholder: "What worked well? What needs improvement?", value: message, onChange: (e) => setMessage(e.currentTarget.value) })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs opacity-70", children: "Email (optional, for follow-up)" }), _jsx("input", { type: "email", className: "rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900", value: email, onChange: (e) => setEmail(e.currentTarget.value) })] }), thanks && _jsx("div", { className: "text-xs", children: thanks }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 pt-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn tab-active", onClick: submit, children: "Submit" }), _jsx("button", { className: "btn", onClick: exportAll, children: "Export JSON" })] }), _jsx("button", { className: "btn", onClick: clearAll, children: "Clear stored" })] })] })] }) }))] }));
}
