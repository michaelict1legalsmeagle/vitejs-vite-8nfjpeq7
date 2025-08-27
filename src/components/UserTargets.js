import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePrefs } from "@/store/usePrefs";
const ROWS = [
    { key: "gross", label: "Gross Yield", hint: "%", asPercent: true },
    { key: "net", label: "Net Yield", hint: "%", asPercent: true },
    { key: "coc", label: "Cash-on-Cash", hint: "%", asPercent: true },
    { key: "icr", label: "ICR (min)", hint: "×" },
    { key: "roi5", label: "ROI (5y)", hint: "%", asPercent: true },
    { key: "breakeven", label: "Break-even (max)", hint: "%", asPercent: true },
    { key: "ltv", label: "LTV (max)", hint: "%", asPercent: true },
    { key: "sdlt", label: "SDLT Impact (max)", hint: "%", asPercent: true },
];
export default function UserTargets() {
    const targets = usePrefs((s) => s.values.targets);
    const setTarget = usePrefs((s) => s.setTarget);
    const reset = usePrefs((s) => s.resetTargets);
    return (_jsxs("section", { className: "rounded-xl border bg-white px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "font-semibold", children: "User Targets (override)" }), _jsx("button", { className: "text-xs px-2 py-1 rounded border hover:bg-slate-50", onClick: () => reset(), title: "Clear all overrides", children: "Reset" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2", children: ROWS.map((r) => {
                    const v = targets?.[r.key];
                    const display = r.asPercent
                        ? v != null
                            ? String((v * 100).toFixed(2))
                            : ""
                        : v != null
                            ? String(v)
                            : "";
                    return (_jsxs("label", { className: "text-xs flex flex-col gap-1", children: [_jsx("span", { className: "opacity-70", children: r.label }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("input", { className: "w-full rounded border px-2 py-1", placeholder: r.asPercent ? "e.g. 8.0" : r.hint === "×" ? "e.g. 1.45" : "e.g. 0.50", value: display, onChange: (e) => {
                                            const raw = e.target.value.trim();
                                            if (!raw) {
                                                setTarget(r.key, null);
                                                return;
                                            }
                                            const num = Number(raw);
                                            if (!Number.isFinite(num))
                                                return;
                                            const val = r.asPercent ? num / 100 : num;
                                            setTarget(r.key, val);
                                        } }), _jsx("span", { className: "opacity-60", children: r.hint })] })] }, r.key));
                }) }), _jsx("p", { className: "text-[11px] mt-2 opacity-60", children: "Enter a value to override thresholds for that metric. Percent inputs are the target for \uD83D\uDFE2 Green (e.g. Net \u2265 6%). For \u201Cmax\u201D metrics (LTV, Break-even, SDLT) lower is better." })] }));
}
