import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AppProviders from './providers/AppProviders.jsx'
import './index.css'
import './i18n/config'
import { initPosthog } from './lib/analytics'

initPosthog()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)

