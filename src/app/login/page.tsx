"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogleMobile, initMobileAuthListener, isCapacitor } from "@/lib/mobile-auth";
import { sanitizeNext, stashNext } from "@/lib/login-next";
import { isDemoMode, DEMO_USER } from "@/lib/demo";
import { supabase } from "@/lib/supabase";

const demo = isDemoMode();

/** /login?next=... 에서 복귀 경로 추출 (Open Redirect 방어 포함) */
function readNextParam(): string {
  if (typeof window === "undefined") return "/";
  return sanitizeNext(new URLSearchParams(window.location.search).get("next"));
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 약관·개인정보처리방침 명시 동의 (스토어 심사 요건 — 미동의 시 모든 진입 차단)
  const [agreed, setAgreed] = useState(false);

  // 이메일 로그인 (심사용 / 공개 가입 없이 로그인 전용)
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // auth/callback 실패(?error=) 또는 탈퇴 완료(?deleted=1) 메시지 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const deleted = params.get("deleted");
    // 클라이언트 전용 값(URL 쿼리) 읽기 → 하이드레이션 후 setState가 정답. 1회성, 캐스케이드 아님.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (deleted) {
      setNotice("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
    }
    if (err) {
      setError(
        err === "timeout"
          ? "로그인 시간이 초과되었습니다. 다시 시도해주세요."
          : `로그인에 실패했습니다: ${err}`,
      );
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 모바일 환경에서 앱 URL 딥링크 리스너 등록
  // 웹 환경에서는 아무 동작 없음
  useEffect(() => {
    // 데모 모드: OAuth/딥링크 리스너 불필요
    if (demo) return;

    let cleanup: (() => void) | undefined;

    initMobileAuthListener(
      // 세션 교환 성공 → 원래 보던 페이지로 복귀 (next 없으면 홈)
      () => {
        setLoading(false);
        router.push(readNextParam());
      },
      // 실패
      (msg) => {
        setLoading(false);
        setError(msg);
      },
    ).then((fn) => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
    };
  }, [router]);

  const requireAgreement = (): boolean => {
    if (!agreed) {
      setError("이용약관 및 개인정보처리방침에 동의해주세요.");
      return false;
    }
    return true;
  };

  const handleDemoEnter = () => {
    if (!requireAgreement()) return;
    try {
      sessionStorage.setItem("demo_user", JSON.stringify(DEMO_USER));
    } catch {
      // sessionStorage 차단 환경에서도 진입은 진행
    }
    router.push("/");
  };

  const handleGoogleLogin = async () => {
    if (!requireAgreement()) return;
    setLoading(true);
    setError(null);
    try {
      // 복귀 경로는 sessionStorage로 전달 (redirect URL에 쿼리 금지 — Supabase 허용목록 매칭 깨짐)
      stashNext(readNextParam());
      // isCapacitor() 분기는 signInWithGoogleMobile 내부에서 처리
      await signInWithGoogleMobile();
      // 웹 환경에서는 위 함수가 리디렉션을 트리거하므로 이 이후 코드 실행 안 됨
      // 모바일 환경에서는 Browser.open() 후 대기 → appUrlOpen 이벤트로 복귀
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "로그인에 실패했습니다.";
      setError(msg);
    }
  };

  // 이메일+비밀번호 로그인 (심사원/기존 회원 전용, 공개 가입 없음)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAgreement()) return;
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setLoading(false);
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push(readNextParam());
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero 이미지 */}
      <div className="login-hero">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=860&q=85"
          alt=""
          className="w-full h-full object-cover block"
        />
        {/* 그라디언트 오버레이 */}
        <div className="login-hero-overlay" />
        {/* 브랜드 — Tailwind 유틸리티 스캔 누락(bottom-8/text-white 미생성) 회피, 명시 CSS 클래스 사용 */}
        <div className="login-brand">
          <div className="login-brand-name">Cinderella</div>
          <div className="login-brand-sub">정품 인증 명품 렌탈 플랫폼</div>
        </div>
      </div>

      {/* 로그인 바디 */}
      <div className="flex-1 bg-white px-6 pt-8 pb-11 flex flex-col gap-5">
        <p className="text-sm text-mid leading-relaxed">
          페어리의 명품을 빌려{" "}
          <strong className="text-charcoal font-semibold">나만의 신데렐라 순간</strong>을 만드세요.
          <br />결혼식, 소개팅, 특별한 그 날을 위해.
        </p>

        {/* 탈퇴 완료 등 안내 메시지 */}
        {notice && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {notice}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 약관·개인정보 명시 동의 (스토어 심사 필수 — 미체크 시 모든 진입 버튼 비활성) */}
        <label className="login-consent">
          <input
            type="checkbox"
            className="login-consent-check"
            checked={agreed}
            onChange={(ev) => setAgreed(ev.target.checked)}
            aria-label="이용약관 및 개인정보처리방침 동의"
          />
          <span className="login-consent-text">
            <a href="/terms" className="text-gold no-underline">이용약관</a>
            {" "}및{" "}
            <a href="/privacy" className="text-gold no-underline">개인정보처리방침</a>
            에 동의합니다. (필수)
          </span>
        </label>

        {demo ? (
          <>
            <button
              type="button"
              onClick={handleDemoEnter}
              disabled={!agreed}
              className="btn-demo"
            >
              ✦ 데모로 체험하기 ✦
            </button>
            <p className="text-[10px] text-muted text-center leading-loose">
              투자자 프레젠테이션용 데모 모드입니다.<br />
              로그인 없이 모든 화면을 둘러볼 수 있습니다.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || !agreed}
              className="btn-google"
            >
              <GoogleIcon />
              {loading
                ? isCapacitor()
                  ? "인증 중... (브라우저에서 완료하세요)"
                  : "로그인 중..."
                : "Google 계정으로 시작하기"}
            </button>

            {/* 이메일 로그인 (기존 회원·심사원 전용, 공개 가입 없음) */}
            {!showEmailLogin ? (
              <button
                type="button"
                className="login-email-toggle"
                onClick={() => {
                  setError(null);
                  setShowEmailLogin(true);
                }}
              >
                이메일로 로그인
              </button>
            ) : (
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="login-email" className="form-label">이메일</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="form-label">비밀번호</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    className="form-input"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !agreed}
                  className="btn-primary"
                >
                  {loading ? "로그인 중..." : "이메일로 로그인"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
