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
    // Capacitor 네이티브 프로젝트 + 생성된 번들 산출물 (소스 아님 — 린트 대상 제외)
    "android/**",
    "ios/**",
    "android-templates/**",
    "ios-templates/**",
  ]),
]);

export default eslintConfig;
