// src/components/ScenarioChips.tsx
import React from "react";
import { shallow } from "zustand/shallow";
import { useApp } from "../store/useApp";

const SCENARIOS = ["DEFAULT", "USER", "LENDER", "REGION"] as const;

export default function ScenarioChips() {
  const { scenario, setScenario } = useApp(
    (s) => ({ scenario: s.scenario, setScenario: s.setScenario }),
    shallow
  );

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {SCENARIOS.map((s) => {
        const active = s === scenario;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setScenario(s)}
            className={
              "px-3 py-1 rounded-full border text-sm transition " +
              (active
                ? "bg-black text-white border-black"
                : "bg-white text-black border-slate-300 hover:bg-slate-100")
            }
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
