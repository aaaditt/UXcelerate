import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this project at /UXcelerate/; Vercel serves it at /.
// DEPLOY_BASE lets the same build target both without a code change.
export default defineConfig({
  base: process.env.DEPLOY_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
