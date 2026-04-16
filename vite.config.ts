/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so packaged assets resolve under chrome-extension:// when used as MV3 new tab page
  base: './',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Playwright 用例放在 e2e/，勿被 Vitest 当单元测试执行
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
})
