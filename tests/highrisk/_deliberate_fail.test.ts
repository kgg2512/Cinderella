// J2-3 실패 검출 실검증용 — 확인 후 즉시 삭제한다.
import { describe, it, expect } from "vitest";
import { calcDeposit } from "@/lib/toss";
describe("의도적 실패 (J2-3 검증)", () => {
  it("보증금 배수를 3으로 잘못 기대 → 반드시 실패해야 한다", () => {
    expect(calcDeposit(1)).toBe(3);
  });
});
