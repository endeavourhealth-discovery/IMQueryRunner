import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      COMPASS_URL: "mysql://test:test@localhost:3306/test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "coverage",
      include: ["app/**/*.ts", "server/**/*.ts", "shared/**/*.ts", "models/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "#shared": path.resolve(__dirname, "shared"),
      "~~": path.resolve(__dirname, "."),
      "~": path.resolve(__dirname, "."),
    },
  },
});
