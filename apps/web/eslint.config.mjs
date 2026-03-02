import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off", // disabled for development
      "react-hooks/exhaustive-deps": "off", // can cause issues with async operations
      "react-hooks/set-state-in-effect": "off", // intentional patterns in some components
      "react/no-unescaped-entities": "off", // HTML entity issues
      "@next/next/no-assign-module-variable": "off", // needed in some cases
    },
  },
]);

export default eslintConfig;
