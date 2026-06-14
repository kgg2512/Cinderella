"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import { isDemoMode } from "@/lib/demo";
import WishlistClient from "./WishlistClient";

export default function WishlistPage() {
  const router = useRouter();

  useEffect(() => {
    // 데모 모드: 인증 체크 스킵
    if (isDemoMode()) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(loginPathWithNext());
    });
  }, [router]);

  return <WishlistClient initialWishlist={[]} />;
}
