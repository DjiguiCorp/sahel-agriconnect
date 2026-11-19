import * as Sentry from '@sentry/react';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AppProviders from './providers/AppProviders.jsx'
import './index.css'
import './i18n/config'
import { initPosthog } from './lib/analytics'

const CHUNK_RELOAD_KEY = 'chunk_error_reload';

function isChunkErrorMessage(msg) {
  const text = String(msg || '');
  return (
    text.includes('Failed to fetch dynamically imported module') ||
    text.includes('Importing a module script failed') ||
    text.includes('Unable to preload CSS') ||
    text.includes('ChunkLoadError') ||
    text.includes('Loading chunk') ||
    text.includes('Loading CSS chunk')
  );
}

function reloadOnceForStaleChunk() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    /* private mode / blocked storage — still try one reload */
  }
  window.location.reload();
}

window.addEventListener('error', (event) => {
  const isChunkError =
    isChunkErrorMessage(event.message) ||
    isChunkErrorMessage(event.error?.message) ||
    event.error?.name === 'ChunkLoadError';
  if (isChunkError) {
    reloadOnceForStaleChunk();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || reason || '';
  const isChunkError =
    isChunkErrorMessage(msg) ||
    reason?.name === 'ChunkLoadError';
  if (isChunkError) {
    event.preventDefault?.();
    reloadOnceForStaleChunk();
  }
});

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

initPosthog()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
