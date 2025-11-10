"use client"

import React from "react"

interface State {
  error: Error | null
  info: { componentStack: string } | null
}

export class ClientErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error, info: null }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for now; could be extended to send to telemetry endpoint
    // to help diagnose Netlify client runtime failures.
    // eslint-disable-next-line no-console
    console.error("ClientErrorBoundary caught:", error, info)
    this.setState({ error, info: { componentStack: info.componentStack || "" } })
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children as React.ReactElement

    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ color: "#b91c1c" }}>Client runtime error</h1>
        <p>
          The site encountered a client-side error while rendering. This usually
          indicates a runtime exception in a client component (missing globals,
          error in dynamic import, etc.). See console for details.
        </p>
        <details style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
          <summary>Show error</summary>
          <div>
            <strong>{String(error?.message)}</strong>
            <pre style={{ marginTop: 8 }}>{info?.componentStack}</pre>
          </div>
        </details>
      </div>
    )
  }
}

export default ClientErrorBoundary
