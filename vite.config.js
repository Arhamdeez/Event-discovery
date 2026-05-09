import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Use IPv4 loopback — on some macOS setups `localhost` resolves to ::1 first
        // while nothing is listening on IPv6, which produces ECONNREFUSED in the proxy.
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
})
