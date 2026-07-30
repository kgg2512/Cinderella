import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// 범위 한정 원칙 (G2 2026-07-28 J2):
//   전면 커버리지가 목표가 **아니다.** 대상은 `eval/highrisk_paths.json` 에 동결된
//   고위험 경로(결제·인증·개인정보)뿐이다. include 를 tests/highrisk 로 묶어
//   "테스트가 늘어나면 자동으로 전면 확대되는" 드리프트를 막는다.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/highrisk/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/highrisk/setup.ts"],
    reporters: ["default"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
