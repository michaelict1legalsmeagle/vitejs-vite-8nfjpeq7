import { usePack } from "../store/usePack";

export default function DeepDive() {
  const analysis = usePack((s) => s.analysis);
  if (!analysis) return <p className="text-sm opacity-70">Analyze first to populate the risk register.</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">RAG Risk Register</h2>
      <ul className="space-y-2">
        {analysis.riskRegister.map((r) => (
          <li key={r.id} className="card flex items-start gap-2">
            <span className={`mt-1 h-2 w-2 rounded-full ${
              r.severity === "red" ? "bg-red-500" : r.severity === "amber" ? "bg-amber-500" : "bg-emerald-500"
            }`} />
            <div className="text-sm">
              <div className="font-medium">{r.title}</div>
              {r.note && <div className="opacity-70">{r.note}</div>}
              {typeof r.estCost === "number" && <div>Est. £{r.estCost.toLocaleString()}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
