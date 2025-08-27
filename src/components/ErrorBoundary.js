import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export default class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(err) {
        return { hasError: true, message: String(err?.message || err) };
    }
    componentDidCatch(err, info) {
        console.error("ErrorBoundary caught", err, info);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: { padding: 16 }, children: [_jsx("h1", { style: { fontSize: 20, marginBottom: 8 }, children: "Something broke" }), _jsx("pre", { style: {
                            background: "#111",
                            color: "#eee",
                            padding: 12,
                            borderRadius: 8,
                            overflow: "auto",
                        }, children: this.state.message })] }));
        }
        return this.props.children;
    }
}
