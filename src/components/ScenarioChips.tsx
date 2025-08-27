import React from "react";
import useDealValues from "../store/useDealValues";

type Patch = Partial<ReturnType<typeof useDealValues>["values"]> | ((v: any) => Partial<ReturnType<typeof useDealValues>["values"]>);

type Chip = {
  key: string;
  label: string;
  hint?: string;
  patch: Patch;
};

const CHIPS: Chip[] = [
  {
    key: "conservative",
    label: "Conservative",
    hint: "nudge rate up, rent down slightly",
    patch: (v) => ({
      scenario: "Conservative",
      rate: (v.rate ?? 0) + 0.50,           // +50 bps
      rent: Math.max(0, Math.round((v.rent ?? 0) * 0.97)), // -3%
      product: v.product || "IO",
      term: v.term ?? 25,
    }),
  },
  {
    key: "base",
    label: "Base",
    hint: "return to defaults",
    patch: (v) => ({
      scenario: "Base",
      product: v.product || "IO",
      term: v.term ?? 25,
    }),
  },
  {
    key: "repay",
    label: "Repay",
    hint: "switch product",
    patch: (v) => ({
      scenario: "Repay",
      product: "REPAY",
      term: v.term ?? 25,
    }),
  },
  {
    key: "stretch",
    label: "Stretch",
    hint: "rate down, rent up a touch",
    patch: (v) => ({
      scenario: "Stretch",
      rate: Math.max(0, (v.rate ?? 0) - 0.50),         // -50 bps
      rent: Math.round((v.rent ?? 0) * 1.03),          // +3%
      product: v.product || "IO",
      term: v.term ?? 25,
    }),
  },
];

export default function ScenarioChips() {
  const { values, setValues } = useDealValues((s) => s);

  const onClick = (c: Chip) => {
    const current = values;
    const patch = typeof c.patch === "function" ? c.patch(current) : c.patch;
    setValues(patch);
  };

  const activeKey = (values.scenario || "Base").toLowerCase();

  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((c) => {
        const isActive = activeKey === c.label.toLowerCase();
        return (
          <button
            key={c.key}
            type="button"
            className={isActive ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => onClick(c)}
            title={c.hint}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
