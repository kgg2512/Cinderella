"use client";

import { useState, useEffect, useRef } from "react";
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

// Supabase DB에 데이터가 없을 때 보여줄 데모 아이템
const MOCK_ITEMS: Item[] = [
  {
    id: "mock-1",
    user_id: "demo",
    title: "Neverfull MM Monogram Canvas",
    brand: "Louis Vuitton",
    category: "bags",
    price_per_day: 28000,
    description: null,
    images: ["https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=400&q=82"],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    user_id: "demo",
    title: "Classic Flap Medium Caviar Black",
    brand: "Chanel",
    category: "bags",
    price_per_day: 45000,
    description: null,
    images: ["https://images.unsplash.com/photo-1593418632104-71bd668d1af1?auto=format&fit=crop&w=400&q=82"],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    user_id: "demo",
    title: "Birkin 30 Togo Fauve Gold HW",
    brand: "Hermès",
    category: "bags",
    price_per_day: 90000,
    description: null,
    images: ["https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?auto=format&fit=crop&w=400&q=82"],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    user_id: "demo",
    title: "Datejust 36 Jubilee White Dial",
    brand: "Rolex",
    category: "watches",
    price_per_day: 65000,
    description: null,
    images: ["https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=400&q=82"],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-5",
    user_id: "demo",
    title: "Love Necklace 18K Yellow Gold",
    brand: "Cartier",
    category: "jewelry",
    price_per_day: 35000,
    description: null,
    images: ["https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=400&q=82"],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-6",
    user_id: "demo",
    title: "Signoria Pump 100mm Black",
    brand: "Gucci",
    category: "shoes",
    price_per_day: 18000,
    description: null,
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=82"],
    status: "available",
    created_at: new Date().toISOString(),
  },
];

export default function HomeClient() {
  // 초기값: MOCK_ITEMS로 설정 → SSR/CSR 모두 즉시 6개 아이템 표시
  // useEffect에서 Supabase 실데이터가 오면 교체됨
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "all">("all");
  const [activeBrand, setActiveBrand] = useState("All Brands");
  const [activeSort, setActiveSort] = useState("popular");
  const heroBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data, error }: { data: Item[] | null; error: unknown }) => {
        // DB에 실제 아이템이 없거나 Supabase 오류 시 MOCK_ITEMS 폴백
        if (error || !data || data.length === 0) {
          setItems(MOCK_ITEMS);
        } else {
          setItems(data);
        }
        setLoading(false);
      });
  }, []);

  // Hero 배경 이미지 로드 후 ken-burns 효과 시작
  useEffect(() => {
    const el = heroBgRef.current;
    if (!el) return;
    const img = new Image();
    img.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=860&q=85";
    img.onload = () => el.classList.add("loaded");
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
        {/* 배경 이미지 */}
        <div className="home-hero-bg" ref={heroBgRef} />
        {/* 어두운 그라디언트 오버레이 */}
        <div className="home-hero-overlay" />
        {/* 별빛 반짝임 */}
        <div className="home-hero-sparkles" />
        {/* 텍스트 콘텐츠 */}
        <div className="home-hero-content">
          <div className="home-hero-eyebrow">✦ P2P Luxury Rental Platform ✦</div>
          <div className="home-hero-headline">
            럭셔리를<br /><em>나의 것</em>으로
          </div>
          <div className="home-hero-divider" />
          <div className="home-hero-sub">
            요정들의 명품을 빌려<br />당신만의 신데렐라 순간을 만드세요
          </div>
          <div className="cert-badges">
            <div className="cert-badge cert-badge-auth">✓ 인증 정품 100%</div>
            <div className="cert-badge cert-badge-verified">✦ FairyRating 검증</div>
          </div>
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
        {dbError ? (
          <div className="col-span-2 flex flex-col items-center py-16 gap-3 bg-[#FAF9F7]">
            <div className="text-3xl">⚠️</div>
            <p className="text-[13px] font-medium text-[#1A1816]">데이터베이스 연결 오류</p>
            <p className="text-[11px] text-[#A09589] text-center px-8 leading-relaxed">
              Supabase 시드 데이터를 삽입하면 아이템이 표시됩니다.<br />
              <code className="text-[10px] bg-[#F0EDE8] px-1 rounded">supabase/seed.sql</code> 실행 필요
            </p>
          </div>
        ) : loading ? (
          /* 로딩 스켈레톤 */
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white block">
              <div className="aspect-square bg-[#F0EDE8] animate-pulse" />
              <div className="px-3 pt-2.5 pb-3 space-y-2">
                <div className="h-2 w-12 bg-[#EAE5DF] rounded animate-pulse" />
                <div className="h-3 w-full bg-[#EAE5DF] rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-[#EAE5DF] rounded animate-pulse" />
                <div className="h-4 w-16 bg-[#EAE5DF] rounded animate-pulse mt-1" />
              </div>
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center py-16 gap-4 bg-[#FAF9F7]">
            <div className="text-4xl">✨</div>
            <p className="text-[13px] font-medium text-[#1A1816] tracking-wide">아직 등록된 아이템이 없어요</p>
            <p className="text-[11.5px] text-[#A09589] text-center leading-relaxed px-8">
              첫 번째 요정이 되어보세요.<br />사용하지 않는 명품으로 수익을 만드세요.
            </p>
            <a href="/sell" className="empty-state-cta">
              요정 되기
            </a>
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
                <div className="text-[14px] font-bold text-[#1A1816]">{item.price_per_day.toLocaleString()}원<span className="text-[10px] text-[#A09589] font-normal ml-1">/4시간</span></div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
