import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버측 인증 게이트.  [P2-G2, 2026-07-30 · 회장 결정 (a)]
 *
 * ## 무엇을 막는가
 * `/transactions` · `/profile` · `/items/new` 가 **미인증 상태로 HTTP 200** 이었다(3세션 불변 실측).
 * 클라이언트 가드는 화면만 가릴 뿐 **직접 URL 접근을 막지 못한다** — 그것이 이 결함의 본질이다.
 * 실질 방어선이 Supabase RLS 하나뿐이었고, 이 레포는 2026-07-14 에 실제 위조 이력이 있다.
 * RLS 는 *데이터*를 막지 *페이지 노출*을 막지 않는다.
 *
 * ## 왜 미들웨어여야 했나 (그리고 왜 그동안 불가능했나)
 * 세션이 **localStorage** 에 있었다(`createClient` 기본값). 서버는 localStorage 를 못 읽으므로
 * 미들웨어든 서버 컴포넌트든 **원리적으로** 세션을 볼 수 없었다.
 * → `src/lib/supabase.ts` 를 `createBrowserClient`(@supabase/ssr)로 바꿔 세션을 **쿠키**로 옮겼다.
 *   그 전환이 선행되지 않으면 이 파일은 인증 사용자까지 전원 차단하는 회귀가 된다.
 *
 * ## isDemoMode 와의 관계 — **인증 우회로 쓰지 않는다** (회장 지시 명시)
 * 데모 모드에서는 실제 세션이 없다(`createDemoStub` 의 getSession 은 항상 null).
 * 그래서 데모 배포를 살리려면 우회가 필요한데, **우회를 조용히 두면 결함이 그대로 남는다.**
 * 따라서:
 *   1. 우회는 `NEXT_PUBLIC_DEMO_MODE === "true"` 일 때**만** 성립한다.
 *   2. 우회가 발동하면 응답에 `x-cinderella-auth: demo-bypass` 헤더를 **반드시** 붙인다.
 *      → 프로덕션에서 플래그가 잘못 켜져 있으면 `curl -I` 한 번으로 즉시 드러난다.
 *        우회를 없앨 수 없다면 **관측 가능하게** 만든다.
 *   3. 정상 인증 경로에도 `x-cinderella-auth: session` 을 붙여 둘을 구분한다.
 * 이 세 줄이 "플래그와 인증 검사의 관계"의 코드 명시다.
 */
const PROTECTED = ["/transactions", "/profile", "/items/new"];

function isProtected(pathname: string): boolean {
  // 정확일치 또는 하위 경로. 부분문자열 매칭을 쓰지 않는다
  // (`/profiles-public` 같은 무관 경로가 걸리면 안 된다).
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  // ── 데모 모드 우회 (관측 가능하게) ────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const res = NextResponse.next();
    res.headers.set("x-cinderella-auth", "demo-bypass");
    return res;
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // fail-CLOSED: 인증 여부를 판정할 수 없으면 통과시키지 않는다.
    // (env 사고 시 보호 경로가 통째로 열리는 것이 이 결함의 원형이었다)
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("error", "auth_unavailable");
    const res = NextResponse.redirect(login);
    res.headers.set("x-cinderella-auth", "env-missing");
    return res;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() 를 쓴다 — getSession() 은 쿠키를 검증 없이 신뢰하므로 서버 판정에 부적합.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // 복귀 경로 보존. 오픈 리다이렉트 방지를 위해 내부 경로만 넘긴다.
    const next = pathname + request.nextUrl.search;
    if (next.startsWith("/") && !next.startsWith("//")) {
      login.searchParams.set("next", next);
    }
    const res = NextResponse.redirect(login);
    res.headers.set("x-cinderella-auth", "redirect-unauthenticated");
    return res;
  }

  response.headers.set("x-cinderella-auth", "session");
  return response;
}

export const config = {
  // 정적 자산·이미지·파비콘은 제외. 보호 경로 판정은 middleware() 안에서 한 번 더 한다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
