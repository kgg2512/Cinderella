"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ItemDetailClient from "./ItemDetailClient";
import type { Database } from "@/types/database";
import { isDemoMode, getDemoItem, DEMO_FAIRY } from "@/lib/demo";

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

    // 데모 모드: DEMO_ITEMS에서 단건 조회 + 데모 페어리를 owner로 부착.
    // 데모 아이템에 new Date() 타임스탬프 포함 → lazy init 전환 시 SSR/CSR 하이드레이션 불일치.
    // 1회성 마운트 초기화이며 렌더 캐스케이드 아님 → 의도된 effect 패턴(규칙 오탐).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isDemoMode()) {
      const found = getDemoItem(id);
      setItem(
        found
          ? ({
              ...found,
              owner: {
                id: DEMO_FAIRY.id,
                name: DEMO_FAIRY.name,
                avatar_url: DEMO_FAIRY.avatar_url,
                email: null,
              },
            } as unknown as Item)
          : null,
      );
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

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
