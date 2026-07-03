import { defineConfig } from 'vitest/config';
// @ts-ignore — requires moduleResolution: bundler (see tsconfig.test.json)
import reactOxc from '@vitejs/plugin-react-oxc';
import path from 'path';

// Note: @vitejs/plugin-react-oxc is needed for vitest 4 (rolldown/oxc bundler).
// @vitejs/plugin-react uses esbuild which is ignored by vitest 4's rolldown pipeline.
export default defineConfig({
  plugins: [reactOxc()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
