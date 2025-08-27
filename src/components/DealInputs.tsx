import React from "react";
import { useDeal } from "@/store/useSavedDeals";
import { usePrefs } from "@/store/usePrefs";

export default function DealInputs() {
  const deal = useDeal((s)=>s.values);
  const setDeal = useDeal((s)=>s.set);
  const prefs = usePrefs((s)=>s.values);
  const setPrefs = usePrefs((s)=>s.set);

  return (
    <div className="grid md:grid-cols-3 gap-3">
      <label className="flex flex-col">
        <span className="text-xs opacity-70">Postcode</span>
        <input
          className="input input-bordered p-2 rounded border"
          value={deal.postcode}
          onChange={(e)=>setDeal({ postcode: e.target.value })}
          placeholder="E1 6AB"
        />
      </label>

      <label className="flex flex-col">
        <span className="text-xs opacity-70">User Target: Net Yield (e.g. 0.06)</span>
        <input
          className="input input-bordered p-2 rounded border"
          value={prefs.targets?.net ?? ""}
          onChange={(e)=>setPrefs({ targets: { ...prefs.targets, net: Number(e.target.value) || 0 }})}
          placeholder="0.06"
        />
      </label>

      <label className="flex items-end">
        <span className="text-sm px-2 py-2 rounded bg-slate-100 border">
          Tenancy: {prefs.tenancy}
        </span>
      </label>
    </div>
  );
}
