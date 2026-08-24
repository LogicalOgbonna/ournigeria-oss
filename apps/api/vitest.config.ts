import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Test against packages/tools SOURCE, not its last-built dist — otherwise
      // editing the package without rebuilding yields false-green tests.
      "@ournigeria/tools": resolve(__dirname, "../../packages/tools/src/index.ts"),
    },
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
