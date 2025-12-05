import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so built files work when loaded via file:// in Electron
  base: './',
  server: {
    port: 5173
  }
})

