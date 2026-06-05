import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ItemDetailClient from "./ItemDetailClient";

async function getItem(id: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data, error } = await supabase
    .from("items")
    .select(`
      *,
      owner:users!items_user_id_fkey(id, name, avatar_url, email)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  return <ItemDetailClient item={item} />;
}
