// src/components/Inputs/Rate.tsx
import React from "react";
import { useApp } from "../../store/useApp";

export default function RateInput() {
  const rate = useApp((s) => s.values.rate ?? "");
  const setValue = useApp((s) => s.setValue);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-slate-600">Rate (%)</span>
      <input
        type="number"
        inputMode="decimal"
        step={0.01}
        min={0}
        className="border rounded px-2 py-1"
        value={rate}
        onChange={(e) => {
          const v = e.currentTarget.value;
          // allow typing "5." or "5.2" transiently; commit number when valid
          if (v === "" || /^\d*\.?\d*$/.test(v)) setValue("rate", v);
        }}
        onBlur={(e) => {
          const n = Number(e.currentTarget.value);
          setValue("rate", Number.isFinite(n) ? n : "");
        }}
      />
    </label>
  );
}
