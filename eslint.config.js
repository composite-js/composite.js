import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

const commonRules = {
  ...js.configs.recommended.rules,
  "no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
};

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: commonRules,
  },
  {
    files: ["src/**/*.{js,mjs}", "examples/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
    },
  },
  {
    files: ["test/**/*.{js,mjs}", "scripts/**/*.{js,mjs}", "vite.config.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
  },
  prettier,
];
