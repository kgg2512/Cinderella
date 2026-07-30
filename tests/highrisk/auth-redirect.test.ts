/**
 * 고위험 경로 — 인증 축: 로그인 복귀(next) 오픈 리다이렉트 가드.
 *
 * 왜 이 파일인가: `sanitizeNext` 가 뚫리면 공격자가 `/login?next=https://evil` 로
 * 로그인 직후 외부 사이트로 튕겨 보낼 수 있다(피싱·토큰 탈취 유도).
 * 현재 이 규칙을 지키는 장치는 이 함수 하나뿐이고, 지금까지 테스트가 0개였다.
 *
 * 범위: G2 `eval/highrisk_paths.json` 에 동결된 고위험 경로만. 전면 커버리지 아님.
 */
import { describe, it, expect } from "vitest";
import { sanitizeNext } from "@/lib/login-next";

describe("sanitizeNext — 오픈 리다이렉트 방어", () => {
  it("내부 경로는 그대로 통과한다", () => {
    expect(sanitizeNext("/items/123")).toBe("/items/123");
    expect(sanitizeNext("/profile?tab=deposit")).toBe("/profile?tab=deposit");
  });

  it("빈 값·null·undefined 는 홈으로", () => {
    expect(sanitizeNext(null)).toBe("/");
    expect(sanitizeNext(undefined)).toBe("/");
    expect(sanitizeNext("")).toBe("/");
  });

  it("외부 절대 URL 은 차단된다", () => {
    for (const bad of [
      "https://evil.example",
      "http://evil.example",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
    ]) {
      expect(sanitizeNext(bad), `${bad} 가 통과하면 안 된다`).toBe("/");
    }
  });

  it("프로토콜 상대 URL(//host) 은 차단된다 — 외부로 나가는 대표 우회", () => {
    expect(sanitizeNext("//evil.example")).toBe("/");
    expect(sanitizeNext("//evil.example/path")).toBe("/");
  });

  it("백슬래시 우회는 현재 방어되지 않는다 — 알려진 한계를 고정한다", () => {
    // 브라우저에 따라 `/\evil.example` 를 `//evil.example` 로 해석하는 경우가 있다.
    // 현재 구현은 "/" 로 시작하므로 그대로 통과시킨다.
    // 이 단언은 "지금 이렇다"를 고정한 것이지 안전하다는 뜻이 아니다.
    // 방어를 강화하면 이 테스트가 깨지고, 그때 기대값을 "/" 로 바꾸면 된다.
    expect(sanitizeNext("/\\evil.example")).toBe("/\\evil.example");
  });
});
