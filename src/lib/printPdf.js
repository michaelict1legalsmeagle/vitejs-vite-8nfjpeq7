// src/lib/printPdf.ts
// Dependency-free "export to PDF" via a printable HTML window.
// The browser's print dialog lets the user save as PDF.
import { fmtCurrency } from "./metrics";
function styleBlock() {
    return `
  <style>
    :root {
      --bg:#0B1220; --surface:#0F172A; --text:#E2E8F0; --muted:#94A3B8;
      --green:#16a34a; --amber:#f59e0b; --red:#dc2626; --border:#1f2937;
    }
    @media (prefers-color-scheme: light) {
      :root { --bg:#ffffff; --surface:#ffffff; --text:#0B1220; --muted:#475569; --border:#e5e7eb; }
    }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial;
      background: var(--bg); color: var(--text);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .page { max-width: 960px; margin: 24px auto; padding: 24px; background: var(--surface); border:1px solid var(--border); border-radius: 12px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 18px 0 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); }
    .tile { border:1px solid var(--border); border-radius: 10px; padding: 12px; }
    .label { font-size: 12px; color: var(--muted); }
    .value { font-size: 20px; font-weight: 700; margin-top: 2px; }
    .sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .row { display:flex; gap: 8px; align-items:center; }
    .badge { display:inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; color: #fff; }
    .GREEN { background: var(--green); }
    .AMBER { background: var(--amber); color:#000; }
    .RED { background: var(--red); }
    .meta { display:grid; grid-template-columns: repeat(2,1fr); gap:8px; font-size: 12px; }
    .meta div { padding:8px; border:1px dashed var(--border); border-radius: 8px; }
    .footer { margin-top: 18px; font-size: 11px; color: var(--muted); display:flex; justify-content:space-between; }
    .small { font-size: 11px; color: var(--muted); }
    @media print {
      .no-print { display: none; }
      body { background: #fff; }
      .page { border: none; }
    }
  </style>
  `;
}
function bandClass(n, type) {
    if (type === "yield")
        return n >= 7 ? "GREEN" : n >= 5 ? "AMBER" : "RED";
    if (type === "icr")
        return n >= 1.25 ? "GREEN" : n >= 1.1 ? "AMBER" : "RED";
    return n >= 10 ? "GREEN" : n >= 6 ? "AMBER" : "RED";
}
export function openDealPrintWindow(values, m) {
    const gyBand = bandClass(m.grossYieldPct, "yield");
    const icrBand = bandClass(m.icr, "icr");
    const cocBand = bandClass(m.cocPct, "coc");
    const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Deal Summary</title>
      ${styleBlock()}
    </head>
    <body>
      <div class="page">
        <div class="row" style="justify-content:space-between;">
          <h1>Deal Summary</h1>
          <div class="small">${new Date().toLocaleString()}</div>
        </div>
        <div class="meta" style="margin-bottom:12px;">
          <div><b>Scenario:</b> ${values.scenario ?? "—"}</div>
          <div><b>Region:</b> ${m.region}</div>
          <div><b>Postcode:</b> ${values.postcode || "—"}</div>
          <div><b>Lender:</b> ${values.lender || "(Generic)"} &nbsp;•&nbsp; <b>Stress:</b> ${m.stressUsedPct.toFixed(2)}%</div>
        </div>

        <h2>Metrics</h2>
        <div class="grid">
          <div class="tile">
            <div class="label">Gross Yield</div>
            <div class="value">${m.grossYieldPct.toFixed(1)}%</div>
            <div class="sub"><span class="badge ${gyBand}">${gyBand}</span></div>
          </div>
          <div class="tile">
            <div class="label">ICR (stressed)</div>
            <div class="value">${m.icr.toFixed(2)}×</div>
            <div class="sub"><span class="badge ${icrBand}">${icrBand}</span> @ ${m.stressUsedPct.toFixed(2)}%</div>
          </div>
          <div class="tile">
            <div class="label">Cash-on-Cash</div>
            <div class="value">${m.cocPct.toFixed(1)}%</div>
            <div class="sub"><span class="badge ${cocBand}">${cocBand}</span> cash-in ${fmtCurrency(m.cashInvested)}</div>
          </div>
          <div class="tile">
            <div class="label">Monthly Debt Service</div>
            <div class="value">${fmtCurrency(m.monthlyDebtService)}</div>
            <div class="sub">Annual ${fmtCurrency(m.annualDebtService)}</div>
          </div>
          <div class="tile">
            <div class="label">Annual Cashflow</div>
            <div class="value">${fmtCurrency(m.annualCashflow)}</div>
            <div class="sub">${values.product === "REPAY" ? "After repayments" : "After interest"}</div>
          </div>
          <div class="tile">
            <div class="label">Product</div>
            <div class="value">${values.product || "—"}</div>
            <div class="sub">${values.rate ?? "—"}% • ${values.term ?? "—"} yrs</div>
          </div>
        </div>

        <h2>Inputs</h2>
        <div class="grid">
          <div class="tile"><div class="label">Price</div><div class="value">${fmtCurrency(values.price ?? 0)}</div></div>
          <div class="tile"><div class="label">Rent (pm)</div><div class="value">${fmtCurrency(values.rent ?? 0)}</div></div>
          <div class="tile"><div class="label">Loan</div><div class="value">${fmtCurrency(values.loan ?? 0)}</div></div>
          <div class="tile"><div class="label">Upfront Costs</div><div class="value">${fmtCurrency(values.costs ?? 0)}</div></div>
          <div class="tile"><div class="label">Include SDLT</div><div class="value">${values.includeSdlt ? "Yes" : "No"}</div><div class="sub">SDLT used: ${fmtCurrency(m.sdltIncluded)}</div></div>
          <div class="tile"><div class="label">Term</div><div class="value">${values.term ?? "—"} years</div></div>
        </div>

        <div class="footer">
          <div>Generated by Investor Metrics</div>
          <button class="no-print" onclick="window.print()">Print / Save as PDF</button>
        </div>
      </div>
      <script>
        // Auto-open print after a short tick for layout to render
        setTimeout(() => { window.print(); }, 250);
      </script>
    </body>
  </html>
  `;
    const w = window.open("", "_blank");
    if (!w)
        return;
    w.document.open();
    w.document.write(html);
    w.document.close();
}
