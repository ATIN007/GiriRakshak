import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GiriRakshak - AI Landslide Early Warning System',
        short_name: 'GiriRakshak',
        description: 'AI Landslide Early Warning System for India\'s North Eastern Region',
        theme_color: '#1F3864',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=192&auto=format&fit=crop&q=80',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=512&auto=format&fit=crop&q=80',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
