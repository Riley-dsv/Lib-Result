import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      "dist/**",
      "node_modules/**",
      "public/**",
      "logs/**",
    ],
    globals: false,
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "dist/**",
        "node_modules/**",
        "public/**",
        "logs/**",
      ],
    },
  },
});
