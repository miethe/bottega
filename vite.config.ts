import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/bottega/',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  test: { include: ['src/**/*.test.ts'] },
});
