import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
export default function InvestorInputs() {
    const { values, setValues } = useDealValues((s) => s);
    // ---- handlers (store-level validation will coerce/clamp) ----
    const onNum = (key) => (e) => {
        setValues({ [key]: e.target.value });
    };
    const onText = (key) => (e) => {
        setValues({ [key]: e.target.value });
    };
    const onProduct = (e) => {
        setValues({ product: e.target.value });
    };
    const onIncludeSdlt = (e) => {
        setValues({ includeSdlt: e.target.checked });
    };
    // small helper so empty inputs show "" not 0
    const v = (n) => (n ?? n === 0 ? String(n ?? "") : "");
    return (_jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-base font-semibold mb-3", children: "Investor Inputs" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Purchase Price" }), _jsx("input", { className: "input", inputMode: "decimal", placeholder: "0", value: v(values.price), onChange: onNum("price") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Monthly Rent" }), _jsx("input", { className: "input", inputMode: "decimal", placeholder: "0", value: v(values.rent), onChange: onNum("rent") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Loan Amount" }), _jsx("input", { className: "input", inputMode: "decimal", placeholder: "0", value: v(values.loan), onChange: onNum("loan") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Interest Rate (%)" }), _jsx("input", { className: "input", inputMode: "decimal", placeholder: "0", value: v(values.rate), onChange: onNum("rate") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Term (years)" }), _jsx("input", { className: "input", inputMode: "numeric", placeholder: "0", value: v(values.term), onChange: onNum("term") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Upfront Costs" }), _jsx("input", { className: "input", inputMode: "decimal", placeholder: "0", value: v(values.costs), onChange: onNum("costs") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Product" }), _jsxs("select", { className: "input", value: values.product || "", onChange: onProduct, children: [_jsx("option", { value: "", children: "\u2014" }), _jsx("option", { value: "IO", children: "Interest Only" }), _jsx("option", { value: "REPAY", children: "Repayment" })] })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Postcode" }), _jsx("input", { className: "input", placeholder: "E.g. B3 2JR", value: values.postcode || "", onChange: onText("postcode") })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Lender (optional)" }), _jsx("input", { className: "input", placeholder: "Generic", value: values.lender || "", onChange: onText("lender") })] }), _jsxs("label", { className: "flex items-center gap-2 mt-2", children: [_jsx("input", { type: "checkbox", className: "checkbox", checked: !!values.includeSdlt, onChange: onIncludeSdlt }), _jsx("span", { className: "text-sm text-slate-600 dark:text-slate-300", children: "include SDLT in cash-in" })] })] })] }));
}
