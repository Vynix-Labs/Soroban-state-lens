import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devtools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // stellar-sdk and the decoder worker are inherently ~1 MB each and already
    // isolated as separately-cacheable chunks — suppress the false-positive warning.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep React in its own long-lived cache chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react'
          }
          // TanStack (router, devtools, etc.) in one chunk
          if (id.includes('node_modules/@tanstack')) {
            return 'tanstack'
          }
          // Stellar Design System separate from stellar-sdk
          if (id.includes('node_modules/@stellar/design-system')) {
            return 'stellar-design-system'
          }
          // stellar-sdk (including transitive stellar-base / stellar-sdk.min)
          if (id.includes('node_modules/@stellar/stellar-sdk') || id.includes('node_modules/stellar-base')) {
            return 'stellar-sdk'
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    pool: 'threads',
    setupFiles: ['./src/test/setup.test.ts'],
  },
})
