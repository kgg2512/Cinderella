"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import WishlistClient from "./WishlistClient";

export default function WishlistPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(loginPathWithNext());
    });
  }, [router]);

  return <WishlistClient initialWishlist={[]} />;
}
