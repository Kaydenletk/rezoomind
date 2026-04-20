import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored:
    "chrome-extension/**",
    "prisma/migrations/**",
    "public/**",
    "scripts/**/*.js",
    "scripts/**/*.cjs",
    ".worktrees/**",
    ".superpowers/**",
    ".venv/**",
    "__pycache__/**",
  ]),
  {
    rules: {
      // Pragmatic defaults — tightened progressively. Warn today, error later.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Test files: vitest globals + relaxed rules.
    files: ["tests/**/*.ts", "tests/**/*.tsx", "**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    // Scripts and config files: require() and console are fine.
    files: [
      "*.config.{js,mjs,cjs,ts}",
      "scripts/**/*.{ts,mjs}",
      "debug_*.js",
      "proxy.ts",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
