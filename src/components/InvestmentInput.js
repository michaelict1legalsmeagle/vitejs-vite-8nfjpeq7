import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDeals } from "@/store/useSavedDeals"; // <- correct store
/** Safe number parsing that preserves empty input */
function toNum(v) {
    if (v.trim() === "")
        return "";
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
export default function InvestmentInput() {
    // current values
    const deal = useDeals((s) => s.values);
    // updater — prefer setValues; fall back to legacy set if it exists
    const setValues = useDeals((s) => s.setValues || s.set);
    const set = (patch) => setValues(patch);
    return (_jsxs("section", { className: "rounded-xl border p-4 space-y-3", children: [_jsx("div", { className: "text-lg font-semibold", children: "Inputs" }), _jsxs("div", { className: "grid md:grid-cols-3 gap-3", children: [_jsx(Field, { label: "Price", type: "number", value: deal.price, onChange: (v) => set({ price: v === "" ? 0 : Number(v) }) }), _jsx(Field, { label: "Monthly Rent", type: "number", value: deal.rentMonthly, onChange: (v) => set({ rentMonthly: v === "" ? 0 : Number(v) }) }), _jsx(Field, { label: "Loan", type: "number", value: deal.loan, onChange: (v) => set({ loan: v === "" ? 0 : Number(v) }) }), _jsx(Field, { label: "Rate (e.g. 0.055)", type: "number", step: "0.001", value: deal.rate, onChange: (v) => set({ rate: v === "" ? 0 : Number(v) }) }), _jsx(Field, { label: "Term (years)", type: "number", value: deal.termYears, onChange: (v) => set({ termYears: v === "" ? 0 : Number(v) }) }), _jsx(Field, { label: "Annual Costs", type: "number", value: deal.costsAnnual, onChange: (v) => set({ costsAnnual: v === "" ? 0 : Number(v) }) })] })] }));
}
function Field({ label, value, onChange, type = "text", step, }) {
    return (_jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: label }), _jsx("input", { className: "input input-bordered p-2 rounded border", type: type, step: step, value: value === "" ? "" : String(value), onChange: (e) => onChange(toNum(e.target.value)) })] }));
}
