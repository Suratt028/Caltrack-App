import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // Shared with the mobile app so goals are calculated the same way.
      '@shared': path.resolve(import.meta.dirname, '../src/utils'),
    },
  },
  server: {
    port: 5174,
    fs: { allow: ['..'] },
  },
})
