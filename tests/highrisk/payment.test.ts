/**
 * 고위험 경로 — 결제 축: 보증금 금액 계산 + 송금 딥링크 + 결제 UI 노출 플래그.
 *
 * 왜 이 파일인가: `calcDeposit` 이 정하는 값은 **사용자가 실제로 송금하는 금액**이다.
 * 조용히 바뀌면 돈이 틀어지는데 지금까지 이를 잡는 장치가 0개였다.
 * `paymentsEnabled` 는 앱스토어 심사 중 결제 UI 비노출을 지키는 스위치라,
 * 기본값이 뒤집히면 심사 리스크로 직결된다.
 */
import { describe, it, expect, afterEach } from "vitest";
import { calcDeposit, getTossDeeplink, getKakaoPayLink } from "@/lib/toss";
import { paymentsEnabled } from "@/lib/features";

describe("calcDeposit — 보증금 규칙", () => {
  it("일 임대료의 200%", () => {
    expect(calcDeposit(10000)).toBe(20000);
    expect(calcDeposit(0)).toBe(0);
    expect(calcDeposit(33333)).toBe(66666);
  });

  it("배수가 바뀌면 즉시 실패한다 — 실제 송금액 회귀 가드", () => {
    expect(calcDeposit(1)).toBe(2);
  });
});

describe("송금 딥링크 — 금액·메모가 정확히 실린다", () => {
  it("토스: 금액과 인코딩된 메모", () => {
    const url = getTossDeeplink("someid", 20000, "보증금 결제");
    expect(url.startsWith("https://toss.me/someid?")).toBe(true);
    expect(url).toMatch(/amount=20000(&|$)/);
    expect(url).toContain(encodeURIComponent("보증금 결제"));
  });

  it("토스: 특수문자가 쿼리를 오염시키지 않는다", () => {
    const url = getTossDeeplink("someid", 100, "a&b=c#d");
    expect(url.includes("a&b=c#d")).toBe(false);
    expect(url).toMatch(/amount=100(&|$)/);
  });

  it("카카오페이: 금액 그대로", () => {
    expect(getKakaoPayLink(15000)).toBe("kakaopay://transfer?amount=15000");
  });
});

describe("paymentsEnabled — 심사 중 비노출 기본값", () => {
  const orig = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED;
  afterEach(() => {
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = orig;
  });

  it('정확히 "true" 일 때만 켜진다 (기본은 꺼짐)', () => {
    delete process.env.NEXT_PUBLIC_PAYMENTS_ENABLED;
    expect(paymentsEnabled()).toBe(false);
    for (const v of ["", "false", "1", "TRUE", "yes"]) {
      process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = v;
      expect(paymentsEnabled(), `${v} 로 켜지면 안 된다`).toBe(false);
    }
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = "true";
    expect(paymentsEnabled()).toBe(true);
  });
});
