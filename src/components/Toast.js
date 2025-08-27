import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
const EVT = "lexlot:toast";
export default function Toast() {
    const [msg, setMsg] = useState(null);
    useEffect(() => {
        let t;
        const onToast = (e) => {
            const detail = e.detail || { message: "" };
            setMsg(detail.message || "");
            clearTimeout(t);
            t = setTimeout(() => setMsg(null), detail.duration ?? 1800);
        };
        window.addEventListener(EVT, onToast);
        return () => {
            window.removeEventListener(EVT, onToast);
            clearTimeout(t);
        };
    }, []);
    if (!msg)
        return null;
    return (_jsx("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]", children: _jsx("div", { className: "rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-lg px-4 py-2 text-sm", children: msg }) }));
}
