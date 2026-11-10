import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'emulator',
          environment: 'jsdom',
          include: ['tests/emulator/**/*.test.ts'],
          env: { VITE_FIRESTORE_EMULATOR: '127.0.0.1:8080' },
          testTimeout: 20000,
          fileParallelism: false,
        },
      },
    ],
  },
})
