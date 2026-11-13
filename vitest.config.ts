import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    include: [
      'packages/*/test/**/*.test.ts',
      'apps/web/test/**/*.test.{ts,tsx}',
    ],
  },
});
