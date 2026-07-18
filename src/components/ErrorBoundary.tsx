import { Component, type ReactNode } from "react"

interface Props { children: ReactNode; name?: string }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="m-card p-6 max-w-md">
            <h2 className="m-display text-lg font-semibold m-ink mb-2">
              {this.props.name || "Something went wrong"}
            </h2>
            <p className="text-sm m-muted mb-4">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
