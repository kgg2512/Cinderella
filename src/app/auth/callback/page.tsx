"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const next = searchParams.get("next") ?? "/";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    if (errorParam) {
      router.replace(`/login?error=${encodeURIComponent(errorParam)}`);
      return;
    }

    // detectSessionInUrl:true + flowType:'pkce' → 클라이언트 초기화 시 code 자동 교환
    // SIGNED_IN 이벤트 수신 후 리디렉션
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.replace(safeNext);
      } else if (event === "SIGNED_OUT") {
        subscription.unsubscribe();
        router.replace("/login?error=auth_failed");
      }
    });

    // code 교환이 이미 완료된 경우 대비 fallback
    const timeout = setTimeout(async () => {
      subscription.unsubscribe();
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? safeNext : "/login?error=timeout");
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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
