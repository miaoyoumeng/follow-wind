import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@src': path.resolve(__dirname, './src')
    },
    extensions: ['.json', '.ts', '.vue', '.js']
  },
  test: {
    setupFiles: './test/setup.ts',
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    pool: 'vmThreads'
  }
});
