import React from "react"
export class MayaErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: any }> {
  constructor(p: any) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err: any) { return { err } }
  render() {
    if (this.state.err) return (<div style={{ padding: 24, fontFamily: "monospace", color: "#111", background: "#fff", minHeight: "100vh" }}><h2 style={{ color: "#c00" }}>Maya /next error</h2><pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{String(this.state.err?.message || this.state.err)}</pre><pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#666" }}>{String(this.state.err?.stack || "")}</pre></div>)
    return this.props.children as any
  }
}
