import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      {
        name: 'inject-google-maps',
        transformIndexHtml() {
          const key = env.VITE_GOOGLE_MAPS_KEY
          if (!key) return []
          return [
            {
              tag: 'script',
              attrs: { src: `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`, async: true, defer: true },
              injectTo: 'head',
            },
          ]
        },
      },
    ],
  }
})
