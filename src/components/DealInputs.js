import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDeal } from "@/store/useSavedDeals";
import { usePrefs } from "@/store/usePrefs";
export default function DealInputs() {
    const deal = useDeal((s) => s.values);
    const setDeal = useDeal((s) => s.set);
    const prefs = usePrefs((s) => s.values);
    const setPrefs = usePrefs((s) => s.set);
    return (_jsxs("div", { className: "grid md:grid-cols-3 gap-3", children: [_jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Postcode" }), _jsx("input", { className: "input input-bordered p-2 rounded border", value: deal.postcode, onChange: (e) => setDeal({ postcode: e.target.value }), placeholder: "E1 6AB" })] }), _jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "User Target: Net Yield (e.g. 0.06)" }), _jsx("input", { className: "input input-bordered p-2 rounded border", value: prefs.targets?.net ?? "", onChange: (e) => setPrefs({ targets: { ...prefs.targets, net: Number(e.target.value) || 0 } }), placeholder: "0.06" })] }), _jsx("label", { className: "flex items-end", children: _jsxs("span", { className: "text-sm px-2 py-2 rounded bg-slate-100 border", children: ["Tenancy: ", prefs.tenancy] }) })] }));
}
