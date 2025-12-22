import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // needed for mobile testing
    hmr: {
      clientPort: 443, // Use HTTPS port for HMR through ngrok
    },
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.app',
      '.ngrok.io',
      'localhost',
    ],
    proxy: {
      // Proxy Dropbox API requests to bypass CORS during development
      '/api/dropbox': {
        target: 'https://api.dropboxapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dropbox/, ''),
        secure: true,
      },
      '/content/dropbox': {
        target: 'https://content.dropboxapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/content\/dropbox/, ''),
        secure: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
})
