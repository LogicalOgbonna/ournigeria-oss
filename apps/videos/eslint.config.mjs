import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "build/**",
    "out/**",
    "dist/**",
  ]),
]);

export default eslintConfig;
