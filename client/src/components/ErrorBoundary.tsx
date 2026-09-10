import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this is the one place a client-side crash is visible
    // at all — logging it (even just to the console) beats losing it
    // silently. A real analytics/error-reporting sink can hook in here
    // later without changing the boundary's behavior.
    console.error("[ErrorBoundary] Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "var(--space-6)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</div>
          <h1 style={{ fontSize: 22 }}>Something went wrong</h1>
          <p style={{ maxWidth: 420, color: "var(--color-ink-soft)" }}>
            This page hit an unexpected error. Your files are safe — nothing was uploaded or lost.
          </p>
          <button
            onClick={() => window.location.assign("/")}
            style={{
              marginTop: 12,
              padding: "10px 20px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--color-primary)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to homepage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
