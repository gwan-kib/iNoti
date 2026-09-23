import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Phase 0 has no application behavior to test. Remove with the first tests.
    passWithNoTests: true,
  },
});
