import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
              tag: 'script' as const,
              attrs: {
                src: `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`,
                async: true,
                defer: true,
              },
              injectTo: 'head' as const,
            },
          ]
        },
      },
    ],
  }
})
