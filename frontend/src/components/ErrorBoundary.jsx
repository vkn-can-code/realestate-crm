import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[React App ErrorBoundary caught error]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: 520,
              padding: 36,
              borderRadius: 24,
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#FEF2F2",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: 20, color: "#0F172A", marginBottom: 8 }}>
              Something went wrong loading this view
            </h2>
            <p style={{ fontSize: 13.5, color: "#64748B", marginBottom: 20, lineHeight: 1.5 }}>
              The application encountered a transient render exception ({this.state.error?.message || "Render Error"}).
            </p>

            <button
              onClick={this.handleReload}
              className="btn btn-primary"
              style={{ borderRadius: 999, margin: "0 auto" }}
            >
              <RefreshCw size={15} /> Reload Dashboard View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
