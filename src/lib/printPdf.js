// src/lib/printPdf.ts
// Simple print window for the current deal. No external libs.
import { fmtCurrency, fmtPct } from "./metrics";
export function openDealPrintWindow(values, metrics) {
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
    if (!w)
        return;
    const style = `
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      h2 { font-size: 16px; margin: 20px 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
      .muted { color: #6b7280; font-size: 12px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; }
      @media print {
        body { margin: 0.5in; }
        a { text-decoration: none; color: inherit; }
      }
    </style>
  `;
    const inputs = [
        ["Scenario", values.scenario ?? ""],
        ["Postcode", values.postcode ?? ""],
        ["Lender", values.lender ?? ""],
        ["Product", values.product || ""],
        ["Price", values.price ?? ""],
        ["Monthly rent", values.rent ?? ""],
        ["Loan", values.loan ?? ""],
        ["Rate (%)", values.rate ?? ""],
        ["Term (years)", values.term ?? ""],
        ["Upfront costs", values.costs ?? ""],
        ["Include SDLT", values.includeSdlt ? "Yes" : "No"],
    ];
    const m = [
        ["Region", metrics.region],
        ["Stress rate used", `${metrics.stressUsedPct.toFixed(2)}%`],
        ["Gross yield", fmtPct(metrics.grossYieldPct)],
        ["ICR (x)", metrics.icr.toFixed(2)],
        ["Cash invested", fmtCurrency(metrics.cashInvested)],
        ["Annual cashflow", fmtCurrency(metrics.annualCashflow)],
        ["Cash-on-cash", fmtPct(metrics.cocPct)],
    ];
    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Deal Snapshot</title>
        ${style}
      </head>
      <body>
        <h1>Deal Snapshot</h1>
        <div class="grid">
          <div>
            <h2>Inputs</h2>
            <table>
              <tbody>
                ${inputs.map(([k, v]) => `<tr><th>${k}</th><td class="mono">${v ?? ""}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Metrics</h2>
            <table>
              <tbody>
                ${m.map(([k, v]) => `<tr><th>${k}</th><td class="mono">${v}</td></tr>`).join("")}
              </tbody>
            </table>
            <p class="muted">Generated ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <script>window.addEventListener('load', () => setTimeout(() => window.print(), 50));</script>
      </body>
    </html>
  `;
    w.document.open();
    w.document.write(html);
    w.document.close();
}
