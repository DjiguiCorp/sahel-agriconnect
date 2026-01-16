import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FORCE ENV REFRESH - Jan 16 2026 - Diagnostic override
  // Remove this after confirming env vars work correctly
  define: {
    // This will be overridden by actual env var if set in Vercel
    // But helps diagnose if env vars are being read
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 'http://localhost:3001'
    ),
    'import.meta.env.VITE_WS_BASE_URL': JSON.stringify(
      process.env.VITE_WS_BASE_URL || 'http://localhost:3001'
    ),
  },
})

