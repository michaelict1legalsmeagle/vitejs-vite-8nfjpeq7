import React from "react";

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any): State {
    return { hasError: true, message: String(err?.message || err) };
  }
  componentDidCatch(err: any, info: any) {
    console.error("ErrorBoundary caught", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something broke</h1>
          <pre
            style={{
              background: "#111",
              color: "#eee",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
{this.state.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
