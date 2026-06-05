"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server Component에서 set 무시 */ }
        },
      },
    }
  );
}

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

export async function getWishlist() {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("wishlist")
    .select(`
      id,
      item_id,
      created_at,
      item:items(id, title, brand, images, price_per_day, status)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function addWishlist(itemId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("wishlist")
    .insert([{ user_id: user.id, item_id: itemId }]);

  if (error) {
    // 이미 찜한 경우 (unique constraint)
    if (error.code === "23505") return { success: true }; // 이미 찜됨 = 성공 처리
    return { success: false, error: "찜하기에 실패했습니다." };
  }
  return { success: true };
}

export async function removeWishlist(itemId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", itemId);

  if (error) return { success: false, error: "찜 해제에 실패했습니다." };
  return { success: true };
}
