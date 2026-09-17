import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // "/" locally and on a custom domain; "/ankesi/" on the GitHub project page.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  optimizeDeps: {
    // MapLibre loads its web worker via import.meta.url; pre-bundling breaks
    // that path in dev, so leave the package alone.
    exclude: ['maplibre-gl'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
  // `vite build --ssr src/entry-server.tsx` produces the renderer that
  // scripts/prerender.mjs runs. Dependencies stay external and load from
  // node_modules in Node.
  ssr: {
    target: 'node',
    // styled-components ships CJS whose default export does not interop
    // cleanly from Node ESM; bundling it into the renderer avoids that.
    noExternal: ['styled-components'],
  },
})
