import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // Use 127.0.0.1 so Node does not hit IPv6 (::1) / localhost resolution quirks on Windows
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // Avoid premature close while Spring Boot is starting or restarting (devtools)
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
})
