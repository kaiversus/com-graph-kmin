import { createRoot } from "react-dom/client";
import React, { Component } from "react";
import "./styles/index.css";
import { SkillGraphExplorer } from "./app/components/SkillGraphExplorer";

class ErrorBoundary extends Component<{children: React.ReactNode}, {error: any}> {
  state = { error: null };
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) { console.error("React crash:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: '#fee', color: '#c00', fontFamily: 'monospace' }}>
          <h2>React crashed!</h2>
          <pre>{String(this.state.error)}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Check if we are running in standalone mode (npm run dev) or embedded in Kmin
const rootElement = document.getElementById("react-admin-root") || document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <SkillGraphExplorer audience="admin" />
    </ErrorBoundary>
  );
}