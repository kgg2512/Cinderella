// @vitest-environment node
//
// ★이 파일만 node 환경이다. 미들웨어는 **서버 런타임** 코드이고,
//   jsdom 의 `Headers` 는 Next 의 `NextResponse.next({ request })` 가 요구하는 것과 달라
//   "request.headers must be an instance of Headers" 로 죽는다(실측).
//   런타임을 실제와 맞추는 것이 모킹으로 우회하는 것보다 정확하다.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * 서버측 인증 게이트 단위 검증.  [P5-G1, 2026-07-31]
 *
 * ## 왜 이 파일이 필요한가
 * `goal/20260730-p2-authgate` 는 **미인증 차단**만 실증했고 **인증 정상통과**는 미검증이라
 * 5세션째 병합 대기 중이었다. 그 검증이 "회장 실계정 로그인"을 요구한다고 봤기 때문이다.
 *
 * 그런데 실측 결과 **Supabase 프로젝트가 `Cinderella` 하나뿐**이고 개발/스테이징 분리가 없다.
 * 프로덕션에 테스트 계정을 심는 것은 별개 결정이므로(§B6) 그 경로는 막혀 있다.
 *
 * → 미들웨어는 `createServerClient` 하나에만 의존하므로 **모킹으로 전 분기를 덮을 수 있다.**
 *   이 파일이 덮는 것은 **미들웨어 로직**이지 Supabase 실연동이 아니다(E2 상한, 정직 표기).
 *   실계정 확인은 여전히 유효한 별도 항목이나, 병합의 **유일 조건**은 아니게 된다.
 *
 * ## 과차단 회귀 방지
 * 인증 사용자를 막으면 서비스가 죽는다. 그래서 "차단되는가"만이 아니라
 * **"통과해야 할 것이 통과하는가"** 를 같은 비중으로 본다.
 */

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: mockGetUser } }),
}));

// NextRequest/NextResponse 는 실제 구현을 쓴다 — 리다이렉트·헤더 동작이 진짜여야 의미가 있다.
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const ORIGIN = "https://cinderella.test";

function req(path: string): NextRequest {
  // ★headers 를 명시적으로 넘긴다. 생략하면 `NextResponse.next({ request })` 가
  //   "request.headers must be an instance of Headers" 로 죽는다(vitest 환경 실측).
  return new NextRequest(new URL(path, ORIGIN), { headers: new Headers() });
}

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_DEMO_MODE",
] as const;
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-test-only";
  delete process.env.NEXT_PUBLIC_DEMO_MODE;
  mockGetUser.mockReset();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k]!;
  }
});

const PROTECTED = ["/transactions", "/profile", "/items/new"];

describe("인증 정상통과 — ★5세션 이월의 미검증 축", () => {
  it.each(PROTECTED)("세션이 있으면 %s 를 통과시킨다", async (path) => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await middleware(req(path));
    expect(res.headers.get("x-cinderella-auth")).toBe("session");
    // 리다이렉트가 아니어야 한다 — 인증 사용자를 막으면 서비스가 죽는다
    expect(res.status).not.toBe(307);
    expect(res.headers.get("location")).toBeNull();
  });

  it("하위 경로도 통과시킨다 (/transactions/abc)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await middleware(req("/transactions/abc"));
    expect(res.headers.get("x-cinderella-auth")).toBe("session");
  });
});

describe("미인증 차단", () => {
  it.each(PROTECTED)("세션이 없으면 %s 를 /login 으로 보낸다", async (path) => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(req(path));
    expect(res.headers.get("x-cinderella-auth")).toBe("redirect-unauthenticated");
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("next")).toBe(path);
  });

  it("복귀 경로에 쿼리스트링을 보존한다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(req("/profile?tab=x"));
    const loc = new URL(res.headers.get("location")!);
    expect(loc.searchParams.get("next")).toBe("/profile?tab=x");
  });
});

describe("비보호 경로 — 과차단 회귀 방지", () => {
  it.each(["/", "/login", "/items", "/items/abc"])(
    "%s 는 인증 없이도 통과한다",
    async (path) => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const res = await middleware(req(path));
      expect(res.headers.get("location")).toBeNull();
    },
  );

  it("★부분문자열 오탐 방지 — /profiles-public 은 보호 대상이 아니다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(req("/profiles-public"));
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("env 부재 — fail-CLOSED", () => {
  it("Supabase env 가 없으면 통과시키지 않는다", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await middleware(req("/transactions"));
    expect(res.headers.get("x-cinderella-auth")).toBe("env-missing");
    const loc = new URL(res.headers.get("location")!);
    expect(loc.searchParams.get("error")).toBe("auth_unavailable");
  });
});

describe("데모 우회 — 관측 가능해야 한다", () => {
  it("DEMO_MODE=true 일 때만 우회하고 헤더로 드러난다", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const res = await middleware(req("/transactions"));
    expect(res.headers.get("x-cinderella-auth")).toBe("demo-bypass");
    expect(res.headers.get("location")).toBeNull();
  });

  it("★'true' 가 아닌 값으로는 우회되지 않는다 (플래그 오설정 방어)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    for (const v of ["1", "TRUE", "yes", ""]) {
      process.env.NEXT_PUBLIC_DEMO_MODE = v;
      const res = await middleware(req("/transactions"));
      expect(res.headers.get("x-cinderella-auth")).toBe("redirect-unauthenticated");
    }
  });
});
