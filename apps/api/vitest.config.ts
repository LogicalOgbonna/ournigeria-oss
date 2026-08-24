import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Test against packages/tools SOURCE, not its last-built dist — otherwise
      // editing the package without rebuilding yields false-green tests.
      "@ournigeria/tools": resolve(__dirname, "../../packages/tools/src/index.ts"),
      // Same rationale for the other workspace packages, whose dist/ is only
      // produced by an explicit nx build — tests must not depend on that.
      "@ournigeria/database": resolve(__dirname, "../../packages/database/src/index.ts"),
      "@ournigeria/official-records": resolve(__dirname, "../../packages/official-records/src/index.ts"),
      "@ournigeria/cache": resolve(__dirname, "../../packages/cache/src/index.ts"),
    },
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
