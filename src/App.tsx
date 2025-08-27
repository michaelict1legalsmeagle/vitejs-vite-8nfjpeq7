// src/App.tsx
import React from "react";

// Sections / widgets
import ScenarioChips from "./components/ScenarioChips";
import InvestorInputs from "./components/InvestorInputs";
import FinanceCheck from "./components/FinanceCheck";
import OverallScore from "./components/OverallScore";
import MetricsPanel from "./components/MetricsPanel";
import StatusPanel from "./components/StatusPanel"; // ✅ ensure this points to the new one
import ExplainerPanel from "./components/ExplainerPanel";
import SaveBar from "./components/SaveBar";
import Toast from "./components/Toast";

// Safety net
import ErrorBoundary from "./components/ErrorBoundary";

// Styles
import "./styles/theme.css";
import "./index.css";

export default function App() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Investor Metrics</h1>
        <div className="text-sm text-slate-400">alpha</div>
      </header>

      <ErrorBoundary>
        <div className="grid gap-4">
          {/* Inputs */}
          <div className="card">
            <ScenarioChips />
            <InvestorInputs />
          </div>

          {/* Metrics grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <OverallScore />
            <FinanceCheck />
            <StatusPanel /> {/* ✅ correct StatusPanel */}
          </div>

          <MetricsPanel />
          <ExplainerPanel />
          <SaveBar />
        </div>
      </ErrorBoundary>

      <Toast />
    </div>
  );
}
