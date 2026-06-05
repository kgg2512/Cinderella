"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? "/login?error=auth_failed" : safeNext);
      });
    } else {
      router.replace("/login?error=auth_failed");
    }
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
