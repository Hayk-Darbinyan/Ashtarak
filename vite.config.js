import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// the content server (server/index.js) answers /api and /uploads in dev
const API = 'http://127.0.0.1:5180'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    host: '127.0.0.1',
    proxy: {
      '/api': API,
      '/uploads': API,
    },
    // content edits land in storage/; the dev server must not reload on them
    watch: { ignored: ['**/storage/**'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          gsap: ['gsap'],
        },
      },
    },
  },
})
