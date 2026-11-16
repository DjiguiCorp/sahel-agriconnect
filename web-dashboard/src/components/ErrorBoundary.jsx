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
            {this.state.error?.message ? (
              <p className="text-xs text-amber-700 mt-1 font-mono break-all">
                {String(this.state.error.message).slice(0, 180)}
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-1">
                Please try again. If it persists, reload the page.
              </p>
            )}
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
      <div className="min-h-[50vh] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="text-center max-w-md rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1a3c2e] mb-2">Something went wrong</h2>
          <p className="text-gray-600 text-sm mb-2">
            {this.props.fallbackMessage ||
              'This section hit an unexpected error. Try again or reload the page.'}
          </p>
          {this.state.error?.message ? (
            <p className="text-xs text-gray-400 mb-6 font-mono break-all">
              {String(this.state.error.message).slice(0, 180)}
            </p>
          ) : (
            <div className="mb-6" />
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#1a3c2e] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
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
