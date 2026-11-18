import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const CHUNK_RELOAD_KEY = 'chunk_error_reload';

function isChunkLoadError(error) {
  const message = String(error?.message || '');
  return (
    error?.name === 'ChunkLoadError' ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Unable to preload CSS') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk')
  );
}

function reloadOnceForStaleChunk() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    /* continue */
  }
  window.location.reload();
  return true;
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, chunkReloading: false };
  }

  static getDerivedStateFromError(error) {
    if (isChunkLoadError(error)) {
      return { hasError: false, error: null, chunkReloading: true };
    }
    return { hasError: true, error, chunkReloading: false };
  }

  componentDidCatch(error, info) {
    if (isChunkLoadError(error)) {
      reloadOnceForStaleChunk();
      return;
    }
    // existing error logging (Sentry etc)
    console.error('ErrorBoundary caught:', error, info);
    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      window.Sentry.captureException(error, { extra: info });
    }
  }

  componentDidUpdate(prevProps) {
    // Reset when parent remounts a different section (e.g. admin tab key change)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, chunkReloading: false });
    }
  }

  render() {
    if (this.state.chunkReloading) {
      return null;
    }

    if (!this.state.hasError) return this.props.children;

    const isInline = this.props.inline;
    const isFr = Boolean(this.props.isFr);
    const details = this.state.error?.message
      ? String(this.state.error.message).slice(0, 220)
      : '';

    const title =
      this.props.fallbackMessage ||
      (isFr
        ? 'Une erreur est survenue dans cette section.'
        : 'An error occurred in this section.');
    const retryLabel = isFr ? 'Réessayer' : 'Try again';
    const detailsLabel = isFr ? 'Détails' : 'Details';

    if (isInline) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">{title}</p>
            {details ? (
              <p className="text-xs text-amber-800 mt-1 font-mono break-all">
                {detailsLabel}: {details}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1a3c2e] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
            >
              <RefreshCw className="w-3 h-3" /> {retryLabel}
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
          <h2 className="text-xl font-bold text-[#1a3c2e] mb-2">
            {isFr ? 'Une erreur est survenue' : 'Something went wrong'}
          </h2>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          {details ? (
            <p className="text-xs text-gray-500 mb-6 font-mono break-all">
              {detailsLabel}: {details}
            </p>
          ) : (
            <div className="mb-6" />
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#1a3c2e] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" /> {isFr ? 'Recharger' : 'Reload page'}
          </button>
        </div>
      </div>
    );
  }
}

/** Isolates a single admin tab / API section so one crash does not blank the whole panel. */
export function ApiSection({ children, fallbackMessage, isFr, resetKey }) {
  return (
    <ErrorBoundary
      inline
      isFr={isFr}
      fallbackMessage={fallbackMessage}
      resetKey={resetKey}
    >
      {children}
    </ErrorBoundary>
  );
}
