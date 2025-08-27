import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import useDealValues from "../store/useDealValues";
export default function InvestorInputs() {
    const values = useDealValues((s) => s.values);
    const setValues = useDealValues((s) => s.setValues);
    // Local draft ONLY for rate. We initialize once from the store.
    const [rateDraft, setRateDraft] = React.useState(() => values.rate == null ? "" : String(values.rate));
    // --- generic setters (commit immediately) ---
    const onNum = (field) => (e) => {
        const raw = e.target.value;
        setValues({ [field]: raw === "" ? null : raw });
    };
    const onText = (field) => (e) => {
        setValues({ [field]: e.target.value });
    };
    const onProduct = (e) => {
        setValues({ product: e.target.value });
    };
    const onLender = (e) => {
        setValues({ lender: e.target.value });
    };
    const onIncludeSdlt = (e) => {
        setValues({ includeSdlt: e.target.checked });
    };
    // --- special handlers for rate (commit on blur) ---
    const onRateChange = (e) => {
        // Do NOT touch the store here; just keep what the user typed.
        setRateDraft(e.target.value);
    };
    const onRateBlur = () => {
        const raw = rateDraft.trim().replace(",", ".");
        if (raw === "") {
            setValues({ rate: null });
            return;
        }
        const n = Number(raw);
        if (Number.isFinite(n)) {
            // commit the typed string; store’s coercion can parse it later
            setValues({ rate: raw });
        }
        else {
            // revert draft to last known good numeric value from store
            setRateDraft(values.rate == null ? "" : String(values.rate));
        }
    };
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "text-base font-semibold mb-3", children: "Investor Inputs" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Purchase Price" }), _jsx("input", { className: "input", type: "number", inputMode: "numeric", step: "1", placeholder: "0", value: values.price ?? "", onChange: onNum("price") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Monthly Rent" }), _jsx("input", { className: "input", type: "number", inputMode: "numeric", step: "1", placeholder: "0", value: values.rent ?? "", onChange: onNum("rent") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Loan Amount" }), _jsx("input", { className: "input", type: "number", inputMode: "numeric", step: "1", placeholder: "0", value: values.loan ?? "", onChange: onNum("loan") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Interest Rate (%)" }), _jsx("input", { className: "input", type: "text", inputMode: "decimal", placeholder: "e.g. 6.25", value: rateDraft, onChange: onRateChange, onBlur: onRateBlur })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Term (years)" }), _jsx("input", { className: "input", type: "number", inputMode: "numeric", step: "1", placeholder: "25", value: values.term ?? "", onChange: onNum("term") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Upfront Costs" }), _jsx("input", { className: "input", type: "number", inputMode: "numeric", step: "1", placeholder: "0", value: values.costs ?? "", onChange: onNum("costs") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Product" }), _jsxs("select", { className: "input", value: values.product || "", onChange: onProduct, children: [_jsx("option", { value: "", children: "\u2014" }), _jsx("option", { value: "IO", children: "Interest Only" }), _jsx("option", { value: "REPAY", children: "Repayment" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Postcode" }), _jsx("input", { className: "input", type: "text", placeholder: "E.g. B3 2JR", value: values.postcode || "", onChange: onText("postcode") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-500 mb-1", children: "Lender (optional)" }), _jsxs("select", { className: "input", value: values.lender || "", onChange: onLender, children: [_jsx("option", { value: "", children: "Generic" }), _jsx("option", { value: "NatWest", children: "NatWest" }), _jsx("option", { value: "Barclays", children: "Barclays" }), _jsx("option", { value: "Santander", children: "Santander" })] })] })] }), _jsx("div", { className: "mt-3", children: _jsxs("label", { className: "inline-flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", className: "checkbox", checked: !!values.includeSdlt, onChange: onIncludeSdlt }), _jsx("span", { className: "text-slate-600", children: "include SDLT in cash-in" })] }) })] }));
}
