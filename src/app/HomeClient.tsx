"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase as _supabase } from "@/lib/supabase";
import type { ItemCategory } from "@/types";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;
type Item = Database["public"]["Tables"]["items"]["Row"];

const CATEGORIES: { value: ItemCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "bags", label: "핸드백" },
  { value: "watches", label: "시계" },
  { value: "jewelry", label: "주얼리" },
  { value: "shoes", label: "슈즈" },
  { value: "clothing", label: "의류" },
];

const BRANDS = ["All Brands", "Louis Vuitton", "Chanel", "Hermès", "Dior", "Gucci", "Cartier", "Rolex", "Valentino"];
const SORTS: { value: string; label: string }[] = [
  { value: "popular", label: "인기순" },
  { value: "price_asc", label: "낮은가격" },
  { value: "price_desc", label: "높은가격" },
  { value: "new", label: "신상품" },
];

export default function HomeClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "all">("all");
  const [activeBrand, setActiveBrand] = useState("All Brands");
  const [activeSort, setActiveSort] = useState("popular");

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }: { data: Item[] | null }) => {
        setItems(data ?? []);
      });
  }, []);

  const filtered = items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (activeBrand !== "All Brands" && item.brand !== activeBrand) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === "price_asc") return a.price_per_day - b.price_per_day;
    if (activeSort === "price_desc") return b.price_per_day - a.price_per_day;
    return 0;
  });

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">Cinderella</div>
        <div className="flex gap-0.5">
          <Link href="/search" className="topbar-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <Link href="/wishlist" className="topbar-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 홈 Hero */}
      <div className="home-hero">
        <div className="home-hero-eyebrow">P2P Luxury Rental Platform</div>
        <div className="home-hero-headline">럭셔리를 <em>나의 것</em>으로</div>
        <div className="home-hero-sub">요정들의 명품을 빌려 당신만의 신데렐라 순간을 만드세요</div>
        <div className="cert-badges">
          <div className="cert-badge cert-badge-auth">✓ 인증 정품 100% 보장</div>
          <div className="cert-badge cert-badge-verified">FairyRating 검증</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="filter-section">
        <div className="cat-pills">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveCategory(value)}
              className={`cat-pill${activeCategory === value ? " active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="brand-pills">
          {BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setActiveBrand(b)}
              className={`brand-pill${activeBrand === b ? " active" : ""}`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="sort-row">
          <div className="results-txt">{sorted.length}개 아이템</div>
          <div className="sort-pills">
            {SORTS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveSort(value)}
                className={`sort-pill${activeSort === value ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 아이템 그리드 */}
      <div className="grid grid-cols-2 gap-px bg-[#E8E3DC]">
        {sorted.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center py-16 text-muted gap-2 bg-cream">
            <p className="text-sm">등록된 물품이 없습니다</p>
          </div>
        ) : (
          sorted.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="bg-white block">
              <div className="relative aspect-square overflow-hidden bg-[#F3F0EB]">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A09589] text-xs">
                    사진 없음
                  </div>
                )}
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <div className="text-[9px] tracking-[.18em] uppercase text-[#B8963E] font-bold mb-0.5">{item.brand ?? ""}</div>
                <div className="text-[12.5px] font-medium text-[#1A1816] leading-snug line-clamp-2 mb-1.5">{item.title}</div>
                <div className="text-[14px] font-bold text-[#1A1816]">{item.price_per_day.toLocaleString()}원<span className="text-[10px] text-[#A09589] font-normal ml-1">/일</span></div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
