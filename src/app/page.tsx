import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import HomeClient from "./HomeClient";

async function getItems(category?: string, brand?: string) {
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

  let query = supabase
    .from("items")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(40);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (brand && brand !== "All Brands") {
    query = query.eq("brand", brand);
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const items = await getItems(params.category, params.brand);

  return <HomeClient items={items} initialCategory={params.category ?? "all"} initialBrand={params.brand ?? "All Brands"} initialSort={params.sort ?? "popular"} />;
}
