import { jsx as _jsx } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
const PRESETS = [
    { key: "conservative", label: "Conservative" },
    { key: "base", label: "Base" },
    { key: "repay", label: "Repay" },
    { key: "stretch", label: "Stretch" },
];
export default function ScenarioChips() {
    const values = useDealValues((s) => s.values);
    const setValues = useDealValues((s) => s.setValues);
    const current = (values.scenario || "base").toLowerCase();
    const setScenario = (key) => (e) => {
        e.preventDefault(); // stop any parent form submit
        e.stopPropagation();
        setValues({ scenario: key });
    };
    return (_jsx("div", { className: "flex gap-2", role: "group", "aria-label": "Scenario", children: PRESETS.map((p) => {
            const isActive = current === p.key;
            return (_jsx("button", { type: "button" // <- never "submit"
                , onClick: setScenario(p.key), className: [
                    "btn btn-sm rounded-lg px-3",
                    isActive ? "btn-primary" : "btn-outline",
                ].join(" "), "aria-pressed": isActive, "data-scenario": p.key, children: p.label }, p.key));
        }) }));
}
