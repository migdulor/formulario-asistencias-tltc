const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

// Detectar el entorno de despliegue
const base = process.env.GITHUB_ACTIONS 
  ? '/formulario-asistencias-tltc/' // GitHub Pages
  : '/' // Development

module.exports = defineConfig({
  plugins: [react()],
  base: base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})