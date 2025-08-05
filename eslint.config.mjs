import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import _import from "eslint-plugin-import";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
  globalIgnores(["**/*.d.ts", "**/node_modules", "**/dist"]),
  {
    files: ["**/*.ts", "**/*.js"],
    extends: fixupConfigRules(
      compat.extends(
        "eslint:recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:@typescript-eslint/recommended",
        "prettier"
      )
    ),

    plugins: {
      import: fixupPluginRules(_import),
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
    },

    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },

    rules: {
      "import/no-named-as-default-member": 0,
      "@typescript-eslint/no-var-requires": 0,
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": 2,

      "@typescript-eslint/explicit-module-boundary-types": [
        "warn",
        {
          allowArgumentsExplicitlyTypedAsAny: true,
        },
      ],

      "@typescript-eslint/no-unused-vars": ["error"],

      "padding-line-between-statements": [
        "error",
        {
          blankLine: "any",
          prev: "*",
          next: "*",
        },
      ],

      "object-curly-spacing": ["error", "always"],
      "@typescript-eslint/no-require-imports": ["off"],
    },
  },
]);