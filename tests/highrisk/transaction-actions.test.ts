/**
 * 고위험 경로 — 결제 축: 거래 서버 액션(`src/app/transactions/actions.ts`).
 *
 * 왜 이 파일인가: 2026-07-14 사고는 **인증된 당사자가 자기 행의 금액·상태 컬럼을
 * 위조**한 것이었다. DB 쪽 봉합은 트리거로 끝났지만, 서버 액션 층에도 같은 방어선이
 * 두 개 있다 — ① 클라이언트가 보낸 `depositAmount` 를 신뢰하지 않고 서버가 재계산 ②
 * 모든 상태 전이 전에 당사자·상태 조건 검사.
 *
 * ── 2026-07-31 M5 개정 ────────────────────────────────────────────────────────
 * 독립 검토가 잡은 결함: 이전 판의 더블은 `.eq()` 필터를 무시했다. 그래서 액션의
 * 조회 필터를 엉뚱한 값으로 바꿔도 21/21 이 초록이었다. 이제 더블이 **행 저장소에
 * 필터를 실제로 적용**하므로, 잘못된 대상을 조회하면 0행 → 액션이 실패 경로로 간다.
 *
 * 범위: G2 `eval/highrisk_paths.json` 동결 목록의 `src/app/transactions/actions.ts`.
 * 실 Supabase·실 네트워크에는 접속하지 않는다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase, type Tables, type Row } from "./_supabase-fake";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => state.client,
}));

import {
  requestTransaction,
  acceptTransaction,
  confirmDeposit,
  confirmHandover,
  confirmReturn,
  getTransactionDetail,
} from "@/app/transactions/actions";

let seq = 0;
function useSupabase(user: { id: string } | null, tables: Tables) {
  const c = createFakeSupabase(user, tables, (_t, v) => ({ ...v, id: `tx-new-${++seq}` }));
  state.client = c;
  return c;
}

const ITEM: Row = {
  id: "item-1",
  user_id: "lender-1",
  status: "available",
  price_per_day: 28000,
};

beforeEach(() => {
  state.client = null;
  seq = 0;
});

// ────────────────────────────────────────────────────────────────────────────
describe("requestTransaction — 보증금은 서버가 확정한다 (7/14 사고 클래스 방어선)", () => {
  it("클라이언트가 보낸 금액을 버리고 item.price_per_day × 2 를 저장한다", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { items: [ITEM], transactions: [] });
    // 공격 시나리오: 클라이언트가 보증금 1원이라고 주장한다.
    const r = await requestTransaction("item-1", "2026-08-01", "2026-08-03", 1);
    expect(r.success).toBe(true);
    const ins = sb.opsOf("insert", "transactions")[0];
    expect(ins, "insert 가 아예 일어나지 않았다").toBeTruthy();
    expect(ins.values!.deposit_amount, "클라이언트 금액이 그대로 저장됐다").toBe(56000);
  });

  it("당사자·상태를 클라이언트가 아니라 서버 조회 결과로 채운다", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { items: [ITEM], transactions: [] });
    await requestTransaction("item-1", "2026-08-01", "2026-08-03", 56000);
    const v = sb.opsOf("insert", "transactions")[0].values!;
    expect(v.lender_id).toBe("lender-1"); // 물품 소유자 = 서버 조회값
    expect(v.borrower_id).toBe("borrower-1"); // 요청자 = 세션 사용자
    expect(v.status).toBe("requested");
  });

  it("조회 대상을 정확히 그 물품으로 한정한다 — 필터가 틀리면 실패해야 한다", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { items: [ITEM], transactions: [] });
    await requestTransaction("item-1", "2026-08-01", "2026-08-03", 56000);
    const sel = sb.opsOf("select", "items")[0];
    expect(sel.filters).toEqual([["id", "item-1"]]);
    expect(sel.matched, "요청한 물품이 조회되지 않았다").toBe(1);
  });

  it("존재하지 않는 물품이면 실패하고 DB 쓰기가 없다", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { items: [ITEM], transactions: [] });
    const r = await requestTransaction("nope", "2026-08-01", "2026-08-03", 56000);
    expect(r.success).toBe(false);
    expect(sb.opsOf("insert").length).toBe(0);
  });

  it("본인 물품은 빌릴 수 없고, 그때 insert 는 일어나지 않는다", async () => {
    const sb = useSupabase({ id: "lender-1" }, { items: [ITEM], transactions: [] });
    const r = await requestTransaction("item-1", "2026-08-01", "2026-08-03", 56000);
    expect(r.success).toBe(false);
    expect(sb.opsOf("insert").length, "차단됐는데 DB 쓰기가 일어났다").toBe(0);
  });

  it("대여 불가 상태 물품은 거절된다", async () => {
    const sb = useSupabase(
      { id: "borrower-1" },
      { items: [{ ...ITEM, status: "rented" }], transactions: [] },
    );
    const r = await requestTransaction("item-1", "2026-08-01", "2026-08-03", 56000);
    expect(r.success).toBe(false);
    expect(sb.opsOf("insert").length).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("acceptTransaction — 대여자 본인만, 요청 상태에서만", () => {
  const TX: Row = {
    id: "tx-1", lender_id: "lender-1", borrower_id: "borrower-1", status: "requested",
  };

  it("제3자는 거절되고 update 가 호출되지 않는다", async () => {
    const sb = useSupabase({ id: "stranger" }, { transactions: [{ ...TX }] });
    const r = await acceptTransaction("tx-1", "@myid");
    expect(r).toEqual({ success: false, error: "권한이 없습니다." });
    expect(sb.opsOf("update").length, "권한 없는데 쓰기가 일어났다").toBe(0);
  });

  it("이미 처리된 요청은 재수락되지 않는다", async () => {
    const sb = useSupabase(
      { id: "lender-1" },
      { transactions: [{ ...TX, status: "deposit_requested" }] },
    );
    const r = await acceptTransaction("tx-1", "myid");
    expect(r.success).toBe(false);
    expect(sb.opsOf("update").length).toBe(0);
  });

  it("정상 수락 시 상태 전이 + 토스ID 앞 @ 를 벗긴다 (그 행에만 반영)", async () => {
    const sb = useSupabase({ id: "lender-1" }, { transactions: [{ ...TX }] });
    const r = await acceptTransaction("tx-1", "@sophia_lux");
    expect(r.success).toBe(true);

    const up = sb.opsOf("update", "transactions")[0];
    expect(up.values).toEqual({ status: "deposit_requested", toss_id: "sophia_lux" });
    expect(up.filters).toEqual([["id", "tx-1"]]);
    expect(up.matched, "대상 행에 반영되지 않았다").toBe(1);
    expect(sb.tables.transactions[0].status).toBe("deposit_requested");
  });

  it("다른 거래는 건드리지 않는다", async () => {
    const other: Row = {
      id: "tx-2", lender_id: "lender-1", borrower_id: "b2", status: "requested",
    };
    const sb = useSupabase({ id: "lender-1" }, { transactions: [{ ...TX }, { ...other }] });
    await acceptTransaction("tx-1", "x");
    const untouched = sb.tables.transactions.find((r) => r.id === "tx-2")!;
    expect(untouched.status, "관계없는 거래가 함께 바뀌었다").toBe("requested");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("confirmDeposit — 차용자 본인만, 보증금 요청 상태에서만", () => {
  const TX: Row = {
    id: "tx-1", lender_id: "lender-1", borrower_id: "borrower-1",
    status: "deposit_requested", deposit_amount: 56000,
  };

  it("대여자가 대신 확인할 수 없다", async () => {
    const sb = useSupabase({ id: "lender-1" }, { transactions: [{ ...TX }] });
    const r = await confirmDeposit("tx-1");
    expect(r).toEqual({ success: false, error: "권한이 없습니다." });
    expect(sb.opsOf("update").length).toBe(0);
  });

  it("보증금 요청 상태가 아니면 건너뛸 수 없다", async () => {
    const sb = useSupabase(
      { id: "borrower-1" },
      { transactions: [{ ...TX, status: "requested" }] },
    );
    expect((await confirmDeposit("tx-1")).success).toBe(false);
    expect(sb.opsOf("update").length).toBe(0);
  });

  it("정상 확인 시 상태만 바뀐다 — 금액은 그대로다", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { transactions: [{ ...TX }] });
    expect((await confirmDeposit("tx-1")).success).toBe(true);
    const up = sb.opsOf("update", "transactions")[0];
    expect(up.values).toEqual({ status: "deposit_confirmed" });
    expect(sb.tables.transactions[0].deposit_amount, "금액이 함께 바뀌었다").toBe(56000);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("confirmHandover — 역할별 자기 플래그만 쓴다", () => {
  const base: Row = {
    id: "tx-1",
    lender_id: "lender-1",
    borrower_id: "borrower-1",
    status: "deposit_confirmed",
    lender_confirmed_handover: false,
    borrower_confirmed_handover: false,
  };

  it("한쪽만 확인하면 상태는 유지되고 자기 플래그만 켜진다", async () => {
    const sb = useSupabase({ id: "lender-1" }, { transactions: [{ ...base }] });
    expect((await confirmHandover("tx-1", "lender")).success).toBe(true);
    const up = sb.opsOf("update", "transactions")[0];
    expect(up.values).toEqual({ lender_confirmed_handover: true, status: "deposit_confirmed" });
    expect(
      sb.tables.transactions[0].borrower_confirmed_handover,
      "상대편 플래그를 대신 켰다",
    ).toBe(false);
  });

  it("상대가 이미 확인했으면 handed_over 로 전이한다", async () => {
    const sb = useSupabase(
      { id: "borrower-1" },
      { transactions: [{ ...base, lender_confirmed_handover: true }] },
    );
    expect((await confirmHandover("tx-1", "borrower")).success).toBe(true);
    expect(sb.tables.transactions[0].status).toBe("handed_over");
  });

  it("역할을 사칭하면 거절된다 — 차용자가 lender 역할로 호출", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { transactions: [{ ...base }] });
    expect(await confirmHandover("tx-1", "lender")).toEqual({
      success: false,
      error: "권한이 없습니다.",
    });
    expect(sb.opsOf("update").length).toBe(0);
  });

  it("보증금 확인 전에는 전달 확인이 불가하다", async () => {
    const sb = useSupabase(
      { id: "lender-1" },
      { transactions: [{ ...base, status: "requested" }] },
    );
    expect((await confirmHandover("tx-1", "lender")).success).toBe(false);
    expect(sb.opsOf("update").length).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("confirmReturn — 양측 확인 시에만 completed", () => {
  const base: Row = {
    id: "tx-1",
    lender_id: "lender-1",
    borrower_id: "borrower-1",
    status: "handed_over",
    lender_confirmed_return: false,
    borrower_confirmed_return: false,
  };

  it("한쪽만 확인하면 returned 에서 멈춘다", async () => {
    const sb = useSupabase({ id: "borrower-1" }, { transactions: [{ ...base }] });
    expect((await confirmReturn("tx-1", "borrower")).success).toBe(true);
    expect(sb.tables.transactions[0].status).toBe("returned");
  });

  it("상대가 이미 확인했으면 completed 로 전이한다 — 보증금 반환 트리거 지점", async () => {
    const sb = useSupabase(
      { id: "lender-1" },
      { transactions: [{ ...base, status: "returned", borrower_confirmed_return: true }] },
    );
    expect((await confirmReturn("tx-1", "lender")).success).toBe(true);
    expect(sb.tables.transactions[0].status).toBe("completed");
  });

  it("전달 전 상태에서는 반납 확인이 불가하다", async () => {
    const sb = useSupabase(
      { id: "lender-1" },
      { transactions: [{ ...base, status: "deposit_confirmed" }] },
    );
    expect((await confirmReturn("tx-1", "lender")).success).toBe(false);
    expect(sb.opsOf("update").length).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("getTransactionDetail — 당사자가 아니면 아무것도 주지 않는다", () => {
  const row: Row = {
    id: "tx-1", lender_id: "lender-1", borrower_id: "borrower-1", deposit_amount: 56000,
  };

  it("제3자에게는 null (RLS 가 뚫려도 액션 층에서 한 번 더 막는다)", async () => {
    useSupabase({ id: "stranger" }, { transactions: [{ ...row }] });
    expect(await getTransactionDetail("tx-1")).toBeNull();
  });

  it("당사자에게는 그 거래를 준다", async () => {
    useSupabase({ id: "borrower-1" }, { transactions: [{ ...row }] });
    expect(await getTransactionDetail("tx-1")).toMatchObject({ id: "tx-1" });
  });

  it("남의 거래 id 로는 아무것도 못 얻는다", async () => {
    const other: Row = { id: "tx-9", lender_id: "x", borrower_id: "y" };
    useSupabase({ id: "borrower-1" }, { transactions: [{ ...row }, other] });
    expect(await getTransactionDetail("tx-9")).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("미인증 요청 — 로그인으로 돌려보낸다", () => {
  it("세션이 없으면 /login 리다이렉트로 중단된다", async () => {
    const sb = useSupabase(null, { items: [ITEM], transactions: [] });
    await expect(requestTransaction("item-1", "2026-08-01", "2026-08-03", 1)).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(sb.ops.length, "미인증인데 쿼리가 나갔다").toBe(0);
  });
});
