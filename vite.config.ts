
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    define: {
      // Pass the API Key securely to the client side
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      host: true,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          id: '/', 
          name: 'Jouda World | عالم جودة',
          short_name: 'Jouda',
          description: 'منصتك المتكاملة لحياة خالية من الجلوتين. تسوق، اطبخ، واستمتع.',
          theme_color: '#D32F2F',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png', 
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png', 
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png', 
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.bunny\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'bunny-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Strategy for Google Sheets CSV data
              urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'google-sheets-data',
                networkTimeoutSeconds: 3, 
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 // 1 Day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache images from common CDNs
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
  }
})
