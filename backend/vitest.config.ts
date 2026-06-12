import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      JWT_SECRET: 'test-access-secret-for-vitest',
      JWT_REFRESH_SECRET: 'test-refresh-secret-for-vitest',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/lib/prisma.ts'],
    },
  },
});
