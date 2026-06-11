"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { popStashedNext } from "@/lib/login-next";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Supabase는 일부 실패(서버 에러 등)를 query가 아닌 hash(#error=...)로 전달한다
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const errorParam =
      searchParams.get("error") ??
      hashParams.get("error_description") ??
      hashParams.get("error");
    const code = searchParams.get("code");
    // 복귀 경로: ?next= (레거시) 우선, 없으면 sessionStorage(stashNext) 회수
    const next = searchParams.get("next") ?? popStashedNext();
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    if (errorParam) {
      router.replace(`/login?error=${encodeURIComponent(errorParam)}`);
      return;
    }

    (async () => {
      // 1단계: 이미 세션이 있으면 즉시 이동 (이벤트 놓친 race condition 방지)
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing) {
        router.replace(safeNext);
        return;
      }

      // 2단계: URL에 code가 있으면 명시적으로 교환 (detectSessionInUrl 타이밍 문제 보완)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace(safeNext);
        return;
      }

      // 3단계: code 없는 경우 이벤트 대기 (hash fragment 방식 fallback)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.replace(safeNext);
        }
      });

      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/login?error=timeout");
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-[#A09589] text-sm">로그인 처리 중...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[#A09589] text-sm">로딩 중...</div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
