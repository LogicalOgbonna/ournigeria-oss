import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" path alias so tests import the same modules
      // the app does.
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
