"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  message: string;
};

export class I18nErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Render error",
    };
  }

  componentDidCatch(error: Error, info: { componentStack?: string } = {}) {
    console.error("[I18nErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    try {
      window.localStorage.setItem("sv-lang", "en");
    } catch {
      /* ignore */
    }
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "50vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#070B11",
          color: "#E8EEF7",
          textAlign: "center",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>
          {this.props.fallbackTitle ??
            "Something went wrong while switching language."}
        </h1>
        <p style={{ margin: 0, color: "#9AA8B8", maxWidth: 420 }}>
          Your session was reset to English. You can continue safely.
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            marginTop: 8,
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #00FF9D55",
            background: "#00FF9D",
            color: "#04140e",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Reload in English
        </button>
      </div>
    );
  }
}