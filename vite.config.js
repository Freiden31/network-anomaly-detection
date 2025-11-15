import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: '.', // current folder (rtnc) is root
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, '../dist'), // output to frontend/dist
    emptyOutDir: true, // clear folder before build
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // optional: shortcut for imports
    },
  },
})

