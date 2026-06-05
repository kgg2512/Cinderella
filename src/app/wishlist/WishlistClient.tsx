"use client";

import { useState } from "react";
import Link from "next/link";
import { removeWishlist } from "./actions";

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

export default function WishlistClient({ initialWishlist }: Props) {
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (itemId: string, wishId: string) => {
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
                      <img src={item.images[0]} alt={item.title} />
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
                  disabled={removing === w.id}
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
