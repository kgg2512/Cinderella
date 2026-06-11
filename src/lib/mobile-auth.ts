/**
 * mobile-auth.ts
 *
 * Capacitor 환경에서 Supabase OAuth 콜백을 처리합니다.
 *
 * 문제:
 *   CAPACITOR_BUILD=true 시 Next.js output:'export' 모드 사용.
 *   이 경우 Route Handlers (auth/callback/route.ts) 가 동작하지 않음.
 *
 * 해결:
 *   - App.addListener('appUrlOpen') 으로 딥링크 캐치
 *   - URL에서 PKCE code 추출
 *   - supabase.auth.exchangeCodeForSession(code) 로 세션 교환
 *   - 서버 없이 완전 클라이언트 사이드 처리
 *
 * Supabase 프로젝트 설정 필수:
 *   Authentication → URL Configuration → Redirect URLs 에 추가:
 *   - com.g2company.cinderella://auth/callback  (Android + iOS 딥링크)
 *   - https://<your-vercel-domain>/auth/callback  (웹)
 */

// Capacitor 플러그인은 클라이언트 사이드에서만 임포트 가능
// (SSR 빌드 중 window가 없어 오류 발생 방지)

import { supabase } from '@/lib/supabase';
import { sanitizeNext } from '@/lib/login-next';

/** 현재 Capacitor 네이티브 앱 환경인지 감지 */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>)['Capacitor'];
}

/**
 * OAuth 로그인 실행
 * - 네이티브: @capacitor/browser 인앱 브라우저로 열기 → 딥링크로 복귀
 * - 웹: 기존 supabase.auth.signInWithOAuth 동작 (리디렉션)
 *
 * @param next - 로그인 완료 후 복귀할 내부 경로 (예: "/profile").
 *               웹: auth/callback?next=... 으로 전달되어 callback이 복귀 처리.
 *               네이티브: 딥링크 URI는 Supabase 등록값과 정확히 일치해야 하므로 변경하지 않고,
 *               login 페이지의 appUrlOpen 콜백에서 복귀 처리.
 */
export async function signInWithGoogleMobile(next?: string): Promise<void> {
  // 딥링크 redirect URI: Supabase 프로젝트에 등록된 값과 일치해야 함
  const mobileRedirectTo = 'com.g2company.cinderella://auth/callback';
  const safeNext = sanitizeNext(next);
  const nextQuery = safeNext !== '/' ? `?next=${encodeURIComponent(safeNext)}` : '';
  const webRedirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback${nextQuery}`
      : `/auth/callback${nextQuery}`;

  const redirectTo = isCapacitor() ? mobileRedirectTo : webRedirectTo;

  if (isCapacitor()) {
    // 네이티브 환경: @capacitor/browser 인앱 브라우저 사용
    // Supabase OAuth URL 생성 (리디렉션 없이 URL만 얻기)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // 브라우저 직접 리디렉션 막고 URL 반환
      },
    });

    if (error || !data?.url) {
      console.error('[mobile-auth] OAuth URL 생성 실패:', error);
      throw error ?? new Error('OAuth URL을 가져오지 못했습니다.');
    }

    // @capacitor/browser 동적 임포트 (SSR 안전)
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({
      url: data.url,
      windowName: '_self',
      presentationStyle: 'popover',
    });
  } else {
    // 웹 환경: 기본 리디렉션
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  }
}

/**
 * Capacitor App URL Listener 초기화
 *
 * 앱이 딥링크로 복귀할 때 호출됨.
 * 반드시 앱 최초 마운트 시 1회 등록해야 함 (layout.tsx 또는 최상위 클라이언트 컴포넌트).
 *
 * @param onSessionReady - 세션 교환 성공 시 콜백 (예: router.push('/'))
 * @param onError - 실패 시 콜백
 * @returns cleanup 함수 (컴포넌트 unmount 시 호출)
 */
export async function initMobileAuthListener(
  onSessionReady: () => void,
  onError: (msg: string) => void,
): Promise<() => void> {
  if (!isCapacitor()) {
    // 웹에서는 리스너 불필요
    return () => {};
  }

  const { App } = await import('@capacitor/app');

  const handle = await App.addListener('appUrlOpen', async ({ url }) => {
    // 딥링크 예: com.g2company.cinderella://auth/callback?code=xxxx
    if (!url.includes('auth/callback')) return;

    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const errorParam = urlObj.searchParams.get('error');
      const errorDescription = urlObj.searchParams.get('error_description');

      if (errorParam) {
        console.error('[mobile-auth] OAuth 오류:', errorParam, errorDescription);
        onError(errorDescription ?? errorParam);
        return;
      }

      if (!code) {
        console.error('[mobile-auth] code 파라미터 없음:', url);
        onError('인증 코드를 받지 못했습니다.');
        return;
      }

      // PKCE: Authorization Code → Session 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[mobile-auth] exchangeCodeForSession 실패:', error);
        onError(error.message);
        return;
      }

      // 인앱 브라우저 닫기
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
      } catch {
        // Browser 플러그인 없으면 무시
      }

      onSessionReady();
    } catch (e) {
      console.error('[mobile-auth] 딥링크 처리 오류:', e);
      onError('로그인 중 오류가 발생했습니다.');
    }
  });

  // cleanup: 컴포넌트 unmount 시 리스너 제거
  return () => {
    handle.remove();
  };
}
