import React from "react";
import rules from "../data/lenderRules.json";
import { useSettings } from "../store/useSettings.ts";

type Product = { code: "BTL_IO"|"BTL_Repay"; label: string; maxLtv: number; icrBasic: number; icrHigher: number; stressRate: number; };
type Lender = { lenderId: string; name: string; products: Product[] };

export default function LenderSelect() {
  const lenderId = useSettings(s=>s.lenderId);
  const product  = useSettings(s=>s.product);
  const taxBand  = useSettings(s=>s.taxBand);
  const set      = useSettings(s=>s.set);

  const lender = (rules as Lender[]).find(l => l.lenderId === lenderId) ?? (rules as Lender[])[0];
  const prod   = lender.products.find(p => p.code === product) ?? lender.products[0];

  return (
    <div className="bg-white shadow rounded-2xl p-4">
      <div className="text-sm font-semibold mb-2">Finance Settings</div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <label className="flex flex-col">
          <span className="text-xs opacity-70">Lender</span>
          <select
            className="border rounded-lg px-2 py-1.5"
            value={lenderId}
            onChange={(e)=>set({ lenderId: e.target.value })}
          >
            {(rules as Lender[]).map(l => (
              <option key={l.lenderId} value={l.lenderId}>{l.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-xs opacity-70">Product</span>
          <select
            className="border rounded-lg px-2 py-1.5"
            value={product}
            onChange={(e)=>set({ product: e.target.value as any })}
          >
            {lender.products.map(p => (
              <option key={p.code} value={p.code}>{p.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-xs opacity-70">Tax Band</span>
          <select
            className="border rounded-lg px-2 py-1.5"
            value={taxBand}
            onChange={(e)=>set({ taxBand: e.target.value as any })}
          >
            <option value="basic">Basic</option>
            <option value="higher">Higher</option>
          </select>
        </label>
      </div>

      <div className="text-[11px] opacity-60 mt-2">
        Max LTV {Math.round(prod.maxLtv*100)}% · ICR floor { ( (taxBand==="higher")? prod.icrHigher : prod.icrBasic ).toFixed(2) }× · Stress { (prod.stressRate*100).toFixed(2) }%
      </div>
    </div>
  );
}
