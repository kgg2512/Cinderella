import { supabase as _supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export async function getWishlist() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("wishlist")
    .select("id, item_id, created_at, item:items(id, title, brand, images, price_per_day, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function addWishlist(itemId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("wishlist").insert([{ user_id: user.id, item_id: itemId }]);
  if (error) {
    if (error.code === "23505") return { success: true };
    return { success: false, error: "찜하기에 실패했습니다." };
  }
  return { success: true };
}

export async function removeWishlist(itemId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("item_id", itemId);
  if (error) return { success: false, error: "찜 해제에 실패했습니다." };
  return { success: true };
}

export async function checkWishlisted(itemId: string): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .single();
  return !!data;
}
