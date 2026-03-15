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
        }}>
          <div style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            background: "rgba(15, 25, 55, 0.6)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(80, 120, 200, 0.12)",
            borderRadius: 16,
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255, 51, 102, 0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}>
              !
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#E8ECF4" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 12, color: "#7B89A8", marginBottom: 24, lineHeight: 1.5 }}>
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 24px",
                background: "#4A9EFF",
                border: "none",
                borderRadius: 10,
                color: "#FFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(74, 158, 255, 0.3)",
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
