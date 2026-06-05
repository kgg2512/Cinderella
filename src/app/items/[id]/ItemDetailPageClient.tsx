"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ItemDetailClient from "./ItemDetailClient";
import type { Database } from "@/types/database";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
interface Item extends ItemRow { owner?: UserRow | null; }

export default function ItemDetailPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("items")
      .select("*, owner:users!items_user_id_fkey(id, name, avatar_url, email)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setItem((data as unknown as Item) ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[#A09589] text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[#A09589] text-sm">아이템을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return <ItemDetailClient item={item} />;
}
