import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Force rebuild: Updated to ensure environment variables are properly injected
  // Vite automatically handles import.meta.env.VITE_* variables from Vercel
  build: {
    // Force production build to pick up env vars
    target: 'esnext',
  },
})

