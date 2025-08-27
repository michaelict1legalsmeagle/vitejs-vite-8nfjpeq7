import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Sections/widgets that exist
import ScenarioChips from "./components/ScenarioChips";
import InvestorInputs from "./components/InvestorInputs";
import FinanceCheck from "./components/FinanceCheck";
import OverallScore from "./components/OverallScore";
import MetricsPanel from "./components/MetricsPanel";
import ExplainerPanel from "./components/ExplainerPanel";
import SaveBar from "./components/SaveBar";
import ScenarioCompare from "./components/ScenarioCompare"; // ✅ new
// Safety net
import ErrorBoundary from "./components/ErrorBoundary";
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsxs("div", { className: "max-w-6xl mx-auto p-4 space-y-4", children: [_jsxs("header", { className: "mb-4 flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Investor Metrics" }), _jsx("span", { className: "text-xs text-slate-500", children: "alpha" })] }), _jsxs("section", { className: "space-y-3", children: [_jsx(ScenarioChips, {}), _jsx(InvestorInputs, {})] }), _jsxs("section", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(OverallScore, {}), _jsx(FinanceCheck, {}), _jsxs("div", { className: "card", children: [_jsx("div", { className: "text-base font-semibold", children: "Status" }), _jsxs("div", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: ["Live values store: ", _jsx("code", { children: "useDealValues" }), " \u2022 Saves:", " ", _jsx("code", { children: "useSavedDeals" })] })] })] }), _jsx(MetricsPanel, {}), _jsx(ExplainerPanel, {}), _jsx(SaveBar, {}), _jsx(ScenarioCompare, {})] }) }));
}
