import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** GitHub Pages has no SPA rewrites; serving index.html as 404.html lets
 *  deep links like /ankesi/en load the app. */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // "/" locally and on a custom domain; "/ankesi/" on the GitHub project page.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), spaFallback()],
  optimizeDeps: {
    // MapLibre loads its web worker via import.meta.url; pre-bundling breaks
    // that path in dev, so leave the package alone.
    exclude: ['maplibre-gl'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
