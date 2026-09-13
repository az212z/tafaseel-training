import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'auth-service', test: /node_modules[/]@supabase/ },
            { name: 'validation', test: /node_modules[/]zod/ },
            {
              name: 'react-vendor',
              test: /node_modules[/](react|react-dom|scheduler|react-router)/,
            },
          ],
        },
      },
    },
  },
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
})
