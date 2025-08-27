import { jsx as _jsx } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
const PRESETS = [
    {
        key: "base",
        label: "Base",
        patch: {
            scenario: "Base",
        },
    },
    {
        key: "optimistic",
        label: "Optimistic",
        patch: {
            scenario: "Optimistic",
            rent: (v) => Math.round((v?.rent ?? 0) * 1.05),
            rate: (v) => Math.max(0, (v?.rate ?? 0) - 0.25),
            costs: (v) => Math.max(0, Math.round((v?.costs ?? 0) * 0.9)),
        },
    },
    {
        key: "pessimistic",
        label: "Pessimistic",
        patch: {
            scenario: "Pessimistic",
            rent: (v) => Math.round((v?.rent ?? 0) * 0.95),
            rate: (v) => (v?.rate ?? 0) + 0.50,
            costs: (v) => Math.round((v?.costs ?? 0) * 1.1),
        },
    },
];
function applySmartPatch(current, patch) {
    // support function-valued patches for relative tweaks
    const out = {};
    for (const [k, v] of Object.entries(patch)) {
        out[k] = typeof v === "function" ? v(current) : v;
    }
    return out;
}
export default function ScenarioChips() {
    const { values, setValues } = useDealValues((s) => s);
    const onClickPreset = (p) => {
        const delta = applySmartPatch(values, p.patch);
        setValues(delta);
    };
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: PRESETS.map((p) => {
            const active = (values.scenario || "").toLowerCase() === p.label.toLowerCase();
            const cls = active ? "btn btn-primary" : "btn btn-outline";
            return (_jsx("button", { className: cls, onClick: () => onClickPreset(p), type: "button", children: p.label }, p.key));
        }) }));
}
