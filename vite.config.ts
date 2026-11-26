import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls (incl. OAuth redirects/callbacks) to the Express backend.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
