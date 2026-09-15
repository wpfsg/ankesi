import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // MapLibre loads its web worker via import.meta.url; pre-bundling breaks
    // that path in dev, so leave the package alone.
    exclude: ['maplibre-gl'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
