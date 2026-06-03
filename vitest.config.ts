import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      COMPASS_URL: "mysql://test:test@localhost:3306/test",
    },
  },
  resolve: {
    alias: {
      "~~": path.resolve(__dirname, "."),
      "~": path.resolve(__dirname, "."),
    },
  },
});
