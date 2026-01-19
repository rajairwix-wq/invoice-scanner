// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    port: 5174,   // <-- change this to your desired port
    host: true,   // <-- expose to network
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem'
    }
  },
})
