import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/ui/**/*.test.{js,jsx}'],
    setupFiles: ['tests/ui/setup.js'],
    clearMocks: true,
  },
});
