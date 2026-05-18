import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/integration/*.test.ts"],
    coverage: {
      include: ["src/**/*.ts", "tests/integration/*.test.ts"],
      reporter: ["lcov", "text"],
    },
    globals: true,
  },
});
