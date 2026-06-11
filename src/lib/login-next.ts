/**
 * login-next.ts
 *
 * 로그인 복귀 UX 헬퍼.
 * 로그인이 필요한 페이지에서 /login으로 보낼 때 현재 경로를 next 파라미터로 전달하고,
 * 로그인 완료 후 원래 보던 페이지로 복귀시킨다.
 *
 * Open Redirect 방어:
 *   next는 "/"로 시작하고 "//"로 시작하지 않는 내부 경로만 허용 (auth/callback과 동일 규칙).
 */

/** next 파라미터 검증 — 내부 경로만 허용, 그 외엔 "/" 반환 */
export function sanitizeNext(next: string | null | undefined): string {
  if (!next) return "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * 현재 위치를 next로 담은 로그인 경로 생성.
 * 클라이언트 컴포넌트의 useEffect 안에서만 호출할 것 (window 필요).
 */
export function loginPathWithNext(): string {
  if (typeof window === "undefined") return "/login";
  const current = window.location.pathname + window.location.search;
  // 홈/로그인 자체는 next 불필요
  if (current === "/" || current.startsWith("/login")) return "/login";
  return `/login?next=${encodeURIComponent(current)}`;
}

const NEXT_STASH_KEY = "cinderella_login_next";

/**
 * OAuth 시작 직전 복귀 경로를 sessionStorage에 보관.
 * redirectTo URL에 쿼리를 붙이면 Supabase Redirect URL 허용목록 매칭이 깨져
 * 조용히 Site URL로 떨어지므로 (에러 없음), next는 절대 redirect URL에 싣지 않는다.
 */
export function stashNext(next: string): void {
  try {
    const safe = sanitizeNext(next);
    if (safe !== "/") sessionStorage.setItem(NEXT_STASH_KEY, safe);
    else sessionStorage.removeItem(NEXT_STASH_KEY);
  } catch {
    // sessionStorage 차단 환경 — 복귀만 포기, 로그인은 정상 진행
  }
}

/** auth/callback에서 보관된 복귀 경로 회수 (1회용) */
export function popStashedNext(): string {
  try {
    const v = sessionStorage.getItem(NEXT_STASH_KEY);
    sessionStorage.removeItem(NEXT_STASH_KEY);
    return sanitizeNext(v);
  } catch {
    return "/";
  }
}
