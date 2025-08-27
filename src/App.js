import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4", children: [_jsxs("header", { className: "mb-6 flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Investor Metrics" }), _jsx("div", { className: "text-sm text-slate-400", children: "alpha" })] }), _jsx(ErrorBoundary, { children: _jsxs("div", { className: "grid gap-4", children: [_jsxs("div", { className: "card", children: [_jsx(ScenarioChips, {}), _jsx(InvestorInputs, {})] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsx(OverallScore, {}), _jsx(FinanceCheck, {}), _jsx(StatusPanel, {}), " "] }), _jsx(MetricsPanel, {}), _jsx(ExplainerPanel, {}), _jsx(SaveBar, {})] }) }), _jsx(Toast, {})] }));
}
