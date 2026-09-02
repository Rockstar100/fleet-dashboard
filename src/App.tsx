import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';

/** Last-resort boundary so a render error shows a message instead of a blank page. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Dashboard crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid h-full place-items-center bg-surface-0 p-6 text-center text-ink-mid">
          <div>
            <h1 className="text-lg font-semibold text-ink-hi">Something went wrong</h1>
            <p className="mt-1 text-sm">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-sm hover:bg-surface-3"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
