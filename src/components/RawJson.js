import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePack } from "../store/usePack";
import NpsSummary from "./NpsSummary";
export default function RawJson() {
    const analysis = usePack((s) => s.analysis);
    const listing = usePack((s) => s.listing);
    const combined = { listing, analysis };
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(combined, null, 2));
            window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Copied ✓" } }));
        }
        catch {
            window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Copy failed" } }));
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(NpsSummary, {}), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Machine-readable output" }), _jsx("button", { className: "btn", onClick: copy, children: "\uD83D\uDCCB Copy" })] }), _jsxs("p", { className: "text-sm opacity-70 mb-3", children: ["This shows the current in-memory ", _jsx("code", { children: "listing" }), " and ", _jsx("code", { children: "analysis" }), "."] }), _jsx("pre", { className: "text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto", children: JSON.stringify(combined, null, 2) })] })] }));
}
