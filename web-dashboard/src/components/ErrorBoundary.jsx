import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isInline = this.props.inline;

    if (isInline) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {this.props.fallbackMessage || 'This section is temporarily unavailable.'}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              The server may be starting up — please wait 30 seconds and refresh.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="min-h-[50vh] flex items-center justify-center px-4 py-12"
        style={{ background: 'transparent' }}
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-white/60 text-sm mb-6">
            Our server may be temporarily unavailable. This usually resolves in under a minute.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#1D9E75] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" /> Reload page
          </button>
        </div>
      </div>
    );
  }
}

// Convenience wrapper for inline API sections
export function ApiSection({ children, fallbackMessage }) {
  return (
    <ErrorBoundary inline fallbackMessage={fallbackMessage}>
      {children}
    </ErrorBoundary>
  );
}
