import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REMOVED: define block that was blocking environment variables
  // Vite automatically handles import.meta.env.VITE_* variables from Vercel
  // The define block was preventing Vercel env vars from being injected correctly
})

