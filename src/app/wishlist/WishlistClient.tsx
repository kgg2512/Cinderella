"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getWishlist, removeWishlist } from "./client-actions";
import { isDemoMode, DEMO_ITEMS, DEMO_WISHLIST_ITEM_IDS } from "@/lib/demo";

interface ItemShape {
  id: string;
  title: string;
  brand: string | null;
  images: string[];
  price_per_day: number;
  status: string;
}

interface WishItem {
  id: string;
  item_id: string;
  created_at: string;
  // Supabase join: 외래키 조인은 배열 또는 단일 객체로 반환될 수 있음
  item?: ItemShape | ItemShape[] | null;
}

interface Props {
  initialWishlist: WishItem[];
}

// 데모 찜 목록 — DEMO_ITEMS 중 2개를 찜한 상태로 구성
const DEMO_WISHLIST: WishItem[] = DEMO_WISHLIST_ITEM_IDS.map((id) => {
  const it = DEMO_ITEMS.find((d) => d.id === id)!;
  return {
    id: `demo-wish-${id}`,
    item_id: id,
    created_at: new Date().toISOString(),
    item: {
      id: it.id,
      title: it.title,
      brand: it.brand,
      images: it.images ?? [],
      price_per_day: it.price_per_day,
      status: it.status,
    },
  };
});

export default function WishlistClient({ initialWishlist }: Props) {
  const [wishlist, setWishlist] = useState(
    isDemoMode() ? DEMO_WISHLIST : initialWishlist,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(!isDemoMode());

  useEffect(() => {
    // 데모 모드: DB 호출 없이 고정 목록 유지
    if (isDemoMode()) return;
    // refreshing 초기값이 이미 !isDemoMode()(=true)이므로 여기서 재설정 불필요 — 동기 setState 제거
    getWishlist().then((data) => {
      setWishlist(data as WishItem[]);
      setRefreshing(false);
    });
  }, []);

  const handleRemove = async (itemId: string, wishId: string) => {
    // 데모 모드: 로컬 상태에서만 제거
    if (isDemoMode()) {
      setWishlist((prev) => prev.filter((w) => w.id !== wishId));
      return;
    }
    setRemoving(wishId);
    const result = await removeWishlist(itemId);
    if (result.success) {
      setWishlist((prev) => prev.filter((w) => w.id !== wishId));
    }
    setRemoving(null);
  };

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">좋아요</div>
      </div>

      {wishlist.length === 0 ? (
        <div className="wish-empty">
          <div className="wish-empty-icon">♡</div>
          <div className="wish-empty-txt">
            아직 찜한 아이템이 없습니다.<br />마음에 드는 명품을 찜해보세요.
          </div>
        </div>
      ) : (
        <div className="item-list">
          {wishlist.map((w) => {
            if (!w.item) return null;
            // Supabase join은 배열로 반환될 수 있음
            const item: ItemShape | null = Array.isArray(w.item) ? w.item[0] ?? null : w.item;
            if (!item) return null;
            return (
              <div key={w.id} className="wish-item-row">
                <Link href={`/items/${item.id}`} className="wish-item-link">
                  <div className="item-thumb">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={`${item.brand ? item.brand + " " : ""}${item.title} 렌탈 상품`}
                        loading="lazy"
                        width={400}
                        height={400}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#F3F0EB] flex items-center justify-center text-[#A09589] text-xs">
                        사진 없음
                      </div>
                    )}
                  </div>
                  <div className="item-info">
                    <div className="item-brand">{item.brand ?? ""}</div>
                    <div className="item-name">{item.title}</div>
                    <div className="item-price-row">
                      <span className="item-price">{item.price_per_day.toLocaleString()}원</span>
                      <span className="item-per">/ 4시간~</span>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="찜 해제"
                  disabled={removing === w.id || refreshing}
                  onClick={() => handleRemove(item.id, w.id)}
                  className="wish-remove-btn"
                >
                  {removing === w.id ? "..." : "♥"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
