import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'react-draggable': ['react-draggable'],
        },
      },
    },
    commonjsOptions: {
      include: [/pdf-lib/, /react-draggable/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ['pdf-lib', 'react-draggable'],
  },
})
