import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
const STORAGE_KEY = "lexlot_disclaimer_v1_accepted";
export default function Disclaimer({ forceOpen = false }) {
    const [open, setOpen] = useState(false);
    const modalRef = useRef(null);
    const lastFocused = useRef(null);
    useEffect(() => {
        const accepted = localStorage.getItem(STORAGE_KEY) === "1";
        if (forceOpen)
            setOpen(true);
        else if (!accepted)
            setOpen(true);
    }, [forceOpen]);
    // Focus trap + ESC close
    useEffect(() => {
        if (!open)
            return;
        lastFocused.current = document.activeElement || null;
        // focus first focusable in modal
        const focusables = () => (modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
        const first = focusables()[0];
        first?.focus();
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                return;
            }
            if (e.key === "Tab") {
                const items = Array.from(focusables());
                if (items.length === 0)
                    return;
                const idx = items.indexOf(document.activeElement);
                let next = idx;
                if (e.shiftKey)
                    next = idx <= 0 ? items.length - 1 : idx - 1;
                else
                    next = idx === items.length - 1 ? 0 : idx + 1;
                items[next].focus();
                e.preventDefault();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);
    // restore focus on close
    useEffect(() => {
        if (!open)
            lastFocused.current?.focus();
    }, [open]);
    const accept = () => {
        localStorage.setItem(STORAGE_KEY, "1");
        setOpen(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sticky top-0 z-20 w-full text-center text-xs py-1 px-2 bg-amber-50 text-amber-900 border-b border-amber-200", children: ["\u26A0\uFE0F Informational only \u2014 not financial/legal/tax advice.", " ", _jsx("button", { className: "underline hover:opacity-80", onClick: () => setOpen(true), type: "button", children: "Read disclaimer" }), _jsx("span", { className: "mx-1", children: "\u00B7" }), _jsx("button", { className: "underline hover:opacity-80", onClick: () => { localStorage.removeItem(STORAGE_KEY); setOpen(true); }, type: "button", title: "Show again next time", children: "Reset" })] }), open && (_jsx("div", { className: "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4", "aria-hidden": false, children: _jsx("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-label": "Important information & risk disclosure", className: "max-w-xl w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl", children: _jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "text-xl font-semibold mb-2", children: "Important information & risk disclosure" }), _jsxs("div", { className: "text-sm leading-relaxed space-y-2 opacity-90", children: [_jsxs("p", { children: ["LexLot provides automated analysis of documents you upload for information only. It is ", _jsx("b", { children: "not" }), " financial, legal, or tax advice, and outputs may be incomplete or inaccurate. Do not rely solely on this tool."] }), _jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [_jsx("li", { children: "We do not advise whether to buy or bid." }), _jsx("li", { children: "Confirm all fees (buyer\u2019s premium, admin, ground rent, service charges) in the originals." }), _jsx("li", { children: "Property values/rents can fall as well as rise; your capital is at risk." }), _jsx("li", { children: "Obtain independent legal, mortgage/financial and tax advice before acting." })] }), _jsx("p", { className: "text-xs opacity-70", children: "By continuing you accept our Terms & Privacy and agree to use LexLot as a supplementary tool only." })] }), _jsxs("div", { className: "mt-4 flex items-center justify-end gap-2", children: [_jsx("button", { className: "btn", onClick: () => setOpen(false), type: "button", children: "Cancel" }), _jsx("button", { className: "btn tab-active", onClick: accept, type: "button", children: "I understand & agree" })] })] }) }) }))] }));
}
