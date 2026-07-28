/**
 * 고위험 경로 — 결제·개인정보 축: 데모 모드 격리(`src/lib/demo.ts`).
 *
 * 왜 이 파일인가: `isDemoMode()` 하나가 앱 전체의 분기점이다. 이게 켜지면
 * Supabase 클라이언트가 stub 으로 바뀌고(`src/lib/supabase.ts:134`), 사용자는
 * `demo-user-001` 신분을 갖고, 화면엔 가짜 거래·가짜 보증금이 뜬다.
 * 이 스위치가 실수로 켜진 채 스토어 빌드가 나가면 **실사용자가 남의 가짜 거래를
 * 보고 실제 송금을 시도**할 수 있다. 반대로 데모 데이터에 실 개인정보가 섞여 들어가면
 * 투자자 데모 배포본이 곧 유출이다. 이 둘을 잡는 장치가 지금까지 0개였다.
 *
 * 범위: G2 `eval/highrisk_paths.json` 에 동결된 `src/lib/demo.ts`.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isDemoMode,
  DEMO_USER,
  DEMO_ITEMS,
  DEMO_TRANSACTIONS,
  DEMO_BORROWING,
  DEMO_LENDING,
  DEMO_ACTIVE_BORROWING,
  DEMO_ACTIVE_LENDING,
  DEMO_WISHLIST_ITEM_IDS,
  DEMO_CHATS,
  DEMO_MY_ITEMS,
  getDemoItem,
  getDemoTransaction,
  getDemoChat,
} from "@/lib/demo";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** 13~19자리 숫자열 중 Luhn 체크섬을 통과하는 것(=실제 카드번호로 성립하는 것)만 반환. */
function luhnValidRuns(text: string): string[] {
  const hits: string[] = [];
  for (const raw of text.match(/\d[\d -]{11,24}\d/g) ?? []) {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length < 13 || digits.length > 19) continue;
    let sum = 0;
    let dbl = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (dbl) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
      sum += d;
      dbl = !dbl;
    }
    if (sum % 10 === 0) hits.push(digits);
  }
  return hits;
}

// ────────────────────────────────────────────────────────────────────────────
describe('isDemoMode — 정확히 "true" 일 때만 켜진다 (기본 꺼짐)', () => {
  it("환경변수가 없으면 꺼져 있다 — 스토어 빌드의 기본값", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", undefined as unknown as string);
    expect(isDemoMode()).toBe(false);
  });

  it("느슨한 참값들로 켜지지 않는다", () => {
    for (const v of ["", "false", "0", "1", "TRUE", "True", "yes", "on", " true"]) {
      vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", v);
      expect(isDemoMode(), `"${v}" 로 데모 모드가 켜지면 안 된다`).toBe(false);
    }
  });

  it('"true" 로만 켜진다', () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    expect(isDemoMode()).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("데모 데이터에 실 개인정보가 섞이지 않는다", () => {
  const blob = JSON.stringify({
    DEMO_USER,
    DEMO_ITEMS,
    DEMO_TRANSACTIONS,
    DEMO_CHATS,
  });

  it("데모 신분은 접두어로 식별 가능하다 — DB 덤프에서 즉시 골라낼 수 있어야 한다", () => {
    expect(DEMO_USER.id).toMatch(/^demo-/);
    for (const tx of DEMO_TRANSACTIONS) {
      expect(tx.id, "거래 id 가 데모 표식을 잃었다").toMatch(/^demo-/);
    }
  });

  it("실 메일 도메인이 들어 있지 않다", () => {
    expect(DEMO_USER.email).toMatch(/@cinderella\.app$/);
    expect(blob, "실 메일 도메인이 데모 데이터에 박혔다").not.toMatch(
      /@(gmail|naver|daum|hanmail|kakao|outlook|hotmail)\./i,
    );
  });

  it("실 전화번호·주민번호 형태의 문자열이 없다", () => {
    expect(blob).not.toMatch(/01[016789]-?\d{3,4}-?\d{4}/); // 휴대폰
    expect(blob).not.toMatch(/\d{6}-[1-4]\d{6}/); // 주민등록번호
  });

  it("실 결제 계좌·카드번호 형태가 없다", () => {
    // toss_id 는 핸들이어야지 계좌·카드 숫자열이면 안 된다.
    for (const tx of DEMO_TRANSACTIONS) {
      if (tx.toss_id == null) continue;
      expect(tx.toss_id, "toss_id 가 숫자열(계좌/카드) 형태다").not.toMatch(/^\d{6,}$/);
    }
    // 길이만 보면 오탐이 난다(Unsplash 사진 id 가 13자리 숫자다) → Luhn 으로 걸러
    // "실제 카드번호로 성립하는 숫자열"만 잡는다.
    expect(luhnValidRuns(blob), "카드번호로 성립하는 숫자열이 데모 데이터에 있다").toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("데모 금액 불변식 — 화면에 뜨는 숫자가 깨지지 않는다", () => {
  it("보증금은 양의 정수다", () => {
    for (const tx of DEMO_TRANSACTIONS) {
      expect(Number.isInteger(tx.deposit_amount), `${tx.id} 보증금이 정수가 아니다`).toBe(true);
      expect(tx.deposit_amount, `${tx.id} 보증금이 0 이하다`).toBeGreaterThan(0);
    }
  });

  it("일 임대료도 양의 정수다", () => {
    for (const it of DEMO_ITEMS) {
      expect(Number.isInteger(it.price_per_day)).toBe(true);
      expect(it.price_per_day).toBeGreaterThan(0);
    }
  });

  it("대여자와 차용자가 같은 거래는 없다", () => {
    for (const tx of DEMO_TRANSACTIONS) {
      expect(tx.lender_id, `${tx.id}: 자기 자신과 거래`).not.toBe(tx.borrower_id);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("데모 파티션·참조 정합성", () => {
  it("빌린 것/빌려준 것이 배타적이고 전체를 덮는다", () => {
    const b = new Set(DEMO_BORROWING.map((t) => t.id));
    const l = new Set(DEMO_LENDING.map((t) => t.id));
    for (const id of b) expect(l.has(id), `${id} 가 양쪽에 있다`).toBe(false);
    expect(b.size + l.size).toBe(DEMO_TRANSACTIONS.length);
  });

  it("진행 중 목록에 완료 거래가 섞이지 않는다", () => {
    for (const tx of [...DEMO_ACTIVE_BORROWING, ...DEMO_ACTIVE_LENDING]) {
      expect(tx.status, `${tx.id} 가 완료인데 진행 중에 있다`).not.toBe("completed");
    }
  });

  it("모든 거래·위시리스트·채팅·내물품이 실재하는 데모 아이템을 가리킨다", () => {
    for (const tx of DEMO_TRANSACTIONS) {
      expect(getDemoItem(tx.item_id), `${tx.id} 의 item_id 가 깨졌다`).not.toBeNull();
    }
    for (const id of DEMO_WISHLIST_ITEM_IDS) expect(getDemoItem(id)).not.toBeNull();
    for (const c of DEMO_CHATS) expect(getDemoItem(c.item.id)).not.toBeNull();
    for (const it of DEMO_MY_ITEMS) expect(getDemoItem(it.id)).not.toBeNull();
  });

  it("거래 시각은 고정 문자열이다 — SSR/CSR 하이드레이션 드리프트 방지", () => {
    for (const tx of DEMO_TRANSACTIONS) {
      expect(tx.created_at, `${tx.id} created_at 형식`).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(new Date(tx.end_date) >= new Date(tx.start_date), `${tx.id} 기간 역전`).toBe(true);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("조회 헬퍼 — 없는 id 에 조용히 아무거나 주지 않는다", () => {
  it("아이템·거래는 없으면 null", () => {
    expect(getDemoItem("does-not-exist")).toBeNull();
    expect(getDemoTransaction("does-not-exist")).toBeNull();
  });

  it("채팅방은 의도적으로 1번으로 폴백한다(알려진 동작을 고정)", () => {
    expect(getDemoChat("does-not-exist")).toBe(DEMO_CHATS[0]);
    expect(getDemoChat("demo-chat-2")).toBe(DEMO_CHATS[1]);
  });
});
