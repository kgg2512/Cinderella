"use client";

import { useState } from "react";
import Link from "next/link";
import type { ItemCategory } from "@/types";

const CATEGORIES: { value: ItemCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "bags", label: "가방" },
  { value: "clothing", label: "의류" },
  { value: "shoes", label: "슈즈" },
  { value: "accessories", label: "액세서리" },
  { value: "jewelry", label: "주얼리" },
  { value: "watches", label: "시계" },
];

// 목업 데이터 — Supabase 연결 전 UI 확인용
const MOCK_ITEMS = [
  {
    id: "1",
    title: "샤넬 클래식 플랩 미디엄",
    brand: "Chanel",
    category: "bags" as ItemCategory,
    price_per_day: 50000,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"],
    owner: { name: "소유자 A" },
  },
  {
    id: "2",
    title: "에르메스 버킨 35",
    brand: "Hermès",
    category: "bags" as ItemCategory,
    price_per_day: 80000,
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80"],
    owner: { name: "소유자 B" },
  },
  {
    id: "3",
    title: "롤렉스 데이트저스트",
    brand: "Rolex",
    category: "watches" as ItemCategory,
    price_per_day: 40000,
    images: ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80"],
    owner: { name: "소유자 C" },
  },
  {
    id: "4",
    title: "루이비통 스피디 30",
    brand: "Louis Vuitton",
    category: "bags" as ItemCategory,
    price_per_day: 30000,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"],
    owner: { name: "소유자 D" },
  },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "all">("all");

  const filtered =
    activeCategory === "all"
      ? MOCK_ITEMS
      : MOCK_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-cream border-b border-border px-4 pt-12 pb-3">
        <h1 className="text-2xl text-charcoal mb-3 font-display font-normal">
          Cinderella
        </h1>
        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveCategory(value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs transition-colors ${
                activeCategory === value
                  ? "bg-charcoal text-cream"
                  : "bg-surface text-muted border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* 피드 */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {filtered.map((item) => (
          <Link key={item.id} href={`/items/${item.id}`}>
            <div className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
              <div className="aspect-square bg-surface overflow-hidden">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gold font-medium tracking-widest uppercase mb-0.5">
                  {item.brand}
                </p>
                <p className="text-xs text-charcoal leading-snug line-clamp-2 mb-1">
                  {item.title}
                </p>
                <p className="text-sm font-medium text-charcoal">
                  {item.price_per_day.toLocaleString()}
                  <span className="text-[10px] text-muted font-normal ml-0.5">원/일</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <p className="text-sm">등록된 물품이 없습니다</p>
        </div>
      )}
    </div>
  );
}
