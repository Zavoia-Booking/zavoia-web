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
    // Verbatim copies from admin-dashboard (the Website Builder microsite renderer
    // + its leaf helpers). Kept byte-identical to the dashboard source so the
    // published site renders 1:1 — its codebase lints under different rules, so
    // the stricter react-hooks/img rules are relaxed here rather than forking the
    // components. Do not hand-edit these trees; re-copy from admin-dashboard.
    files: [
      "src/features/website/components/**",
      "src/shared/**",
      "src/features/marketplace/utils/**",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
