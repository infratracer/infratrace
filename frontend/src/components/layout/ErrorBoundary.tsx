import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          padding: 32,
          animation: "fadeIn 0.3s ease-out",
        }}>
          <div style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            background: "rgba(12, 22, 52, 0.45)",
            backdropFilter: "blur(48px) saturate(180%)",
            WebkitBackdropFilter: "blur(48px) saturate(180%)",
            border: "1px solid rgba(100, 140, 220, 0.10)",
            borderRadius: 20,
            padding: "44px 36px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "rgba(255, 51, 102, 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
              fontSize: 22, color: "#FF453A",
            }}>
              !
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.88)" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: "11px 28px",
                background: "linear-gradient(135deg, #4A9EFF, #00D4AA)",
                border: "none",
                borderRadius: 12,
                color: "#FFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 18px rgba(74, 158, 255, 0.25)",
                transition: "all 0.25s",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
