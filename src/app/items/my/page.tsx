"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface MyItem {
  id: string;
  title: string;
  brand: string | null;
  price_per_day: number;
  images: string[];
  status: string;
  category: string;
  created_at: string;
}

export default function MyItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      await fetchItems(user.id);
    })();
  }, [router]);

  const fetchItems = async (userId: string) => {
    const { data, error } = await supabase
      .from("items")
      .select("id, title, brand, price_per_day, images, status, category, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("내 물품 조회 오류:", error);
    } else {
      setItems((data ?? []) as MyItem[]);
    }
    setLoading(false);
  };

  const toggleStatus = async (item: MyItem) => {
    const newStatus = item.status === "available" ? "hidden" : "available";
    setUpdatingId(item.id);

    // Supabase 제네릭 타입이 update payload를 과도하게 좁히는 문제 — untyped 클라이언트로 우회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db
      .from("items")
      .update({ status: newStatus })
      .eq("id", item.id);

    if (error) {
      console.error("상태 변경 오류:", error);
    } else {
      setItems((prev): MyItem[] =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="profile-loading-wrap">
        <div className="profile-loading-txt">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="topbar-logo topbar-title">내 물품</div>
        <Link href="/items/new" className="topbar-new-btn">
          + 등록
        </Link>
      </div>

      {/* 빈 상태 */}
      {items.length === 0 && (
        <div className="my-items-empty">
          <div className="rental-empty-icon">✦</div>
          <div className="rental-empty-text">아직 등록한 물품이 없어요</div>
          <div className="rental-empty-sub">첫 물품을 등록해 수익을 만들어보세요</div>
          <Link href="/items/new" className="my-items-register-btn">
            새 물품 등록
          </Link>
        </div>
      )}

      {/* 물품 목록 */}
      {items.map((item) => {
        const thumb = item.images?.[0];
        const isAvailable = item.status === "available";
        const isUpdating = updatingId === item.id;

        return (
          <div key={item.id} className="my-items-row">
            {/* 썸네일 */}
            <Link href={`/items/${item.id}`}>
              <div className="my-items-thumb">
                {thumb ? (
                  <img src={thumb} alt={item.title} />
                ) : (
                  <div className="my-items-thumb" />
                )}
              </div>
            </Link>

            {/* 정보 */}
            <Link href={`/items/${item.id}`} className="my-items-info">
              {item.brand && (
                <div className="item-brand">{item.brand}</div>
              )}
              <div className="tx-card-name">{item.title}</div>
              <div className="my-items-price">
                {item.price_per_day.toLocaleString()}원
                <span className="my-items-price-unit">/ 일</span>
              </div>
            </Link>

            {/* 상태 토글 */}
            <div className="my-items-actions">
              <span className={`status-pill my-items-status-pill ${isAvailable ? "s-deposit-confirmed" : "s-requested"}`}>
                {isAvailable ? "공개" : "숨김"}
              </span>
              <button
                type="button"
                className="my-items-toggle-btn"
                onClick={() => toggleStatus(item)}
                disabled={isUpdating}
              >
                {isUpdating ? "..." : isAvailable ? "숨기기" : "공개"}
              </button>
            </div>
          </div>
        );
      })}

      {/* 하단 여백 (navbar 높이) */}
      <div className="det-spacer" />
      <div className="det-spacer" />
    </div>
  );
}
