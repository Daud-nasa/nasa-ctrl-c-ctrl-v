import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@app': path.resolve(rootDir, './src/app'),
      '@pages': path.resolve(rootDir, './src/pages'),
      '@widgets': path.resolve(rootDir, './src/widgets'),
      '@features': path.resolve(rootDir, './src/features'),
      '@entities': path.resolve(rootDir, './src/entities'),
      '@processes': path.resolve(rootDir, './src/processes'),
      '@shared': path.resolve(rootDir, './src/shared'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@app/styles/forward.scss" as *;\n',
      },
    },
  },
})
