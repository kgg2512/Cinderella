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
