import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// On `build` (GitHub Pages), assets live under the project subpath
// /research-highlight-builder/. Dev server stays at root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/research-highlight-builder/' : '/',
}))
