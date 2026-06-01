"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero 이미지 */}
      <div className="relative overflow-hidden bg-charcoal" style={{ height: "56vh" }}>
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=860&q=85"
          alt=""
          className="w-full h-full object-cover block"
        />
        {/* 그라디언트 오버레이 */}
        <div className="login-hero-overlay" />
        {/* 브랜드 */}
        <div className="absolute bottom-8 left-7 right-7 text-white">
          <div className="font-display text-5xl font-light italic tracking-wider leading-none">
            Cinderella
          </div>
          <div className="text-[10px] tracking-[0.28em] uppercase mt-2 text-white/55">
            정품 인증 명품 렌탈 플랫폼
          </div>
        </div>
      </div>

      {/* 로그인 바디 */}
      <div className="flex-1 bg-white px-6 pt-8 pb-11 flex flex-col gap-5">
        <p className="text-sm text-mid leading-relaxed">
          요정의 명품을 빌려{" "}
          <strong className="text-charcoal font-semibold">나만의 신데렐라 순간</strong>을 만드세요.
          <br />결혼식, 소개팅, 특별한 그 날을 위해.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-google"
        >
          <GoogleIcon />
          {loading ? "로그인 중..." : "Google 계정으로 시작하기"}
        </button>

        <p className="text-[10px] text-muted text-center leading-loose">
          계속 진행하면 Cinderella의{" "}
          <a href="/terms" className="text-gold no-underline">이용약관</a>{" "}
          및{" "}
          <a href="/privacy" className="text-gold no-underline">개인정보처리방침</a>에 동의합니다.
        </p>
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
