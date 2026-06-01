"use client";

import { useState } from "react";
import Link from "next/link";
import type { ItemCategory } from "@/types";

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

const MOCK_ITEMS = [
  {
    id: "1",
    brand: "Louis Vuitton",
    name: "Neverfull MM Monogram Canvas",
    category: "bags" as ItemCategory,
    price: 28000,
    grade: "S급",
    stars: "★★★★★",
    reviewCount: 47,
    img: "https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=400&q=82",
    area: "역삼동",
    posted: "10분 전",
  },
  {
    id: "2",
    brand: "Chanel",
    name: "Classic Flap Medium Caviar Black",
    category: "bags" as ItemCategory,
    price: 45000,
    grade: "S급",
    stars: "★★★★★",
    reviewCount: 62,
    img: "https://images.unsplash.com/photo-1593418632104-71bd668d1af1?auto=format&fit=crop&w=400&q=82",
    area: "논현동",
    posted: "34분 전",
  },
  {
    id: "3",
    brand: "Hermès",
    name: "Birkin 30 Togo Fauve Gold HW",
    category: "bags" as ItemCategory,
    price: 90000,
    grade: "A급",
    stars: "★★★★☆",
    reviewCount: 28,
    img: "https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?auto=format&fit=crop&w=400&q=82",
    area: "청담동",
    posted: "1시간 전",
  },
  {
    id: "4",
    brand: "Rolex",
    name: "Datejust 36 Jubilee White Dial",
    category: "watches" as ItemCategory,
    price: 65000,
    grade: "A급",
    stars: "★★★★★",
    reviewCount: 22,
    img: "https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=400&q=82",
    area: "청담동",
    posted: "7시간 전",
  },
  {
    id: "5",
    brand: "Cartier",
    name: "Love Necklace 18K Yellow Gold",
    category: "jewelry" as ItemCategory,
    price: 35000,
    grade: "S급",
    stars: "★★★★★",
    reviewCount: 53,
    img: "https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=400&q=82",
    area: "도산공원",
    posted: "5시간 전",
  },
  {
    id: "6",
    brand: "Gucci",
    name: "Signoria Pump 100mm Black",
    category: "shoes" as ItemCategory,
    price: 18000,
    grade: "S급",
    stars: "★★★★★",
    reviewCount: 39,
    img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=82",
    area: "강남구",
    posted: "3시간 전",
  },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "all">("all");
  const [activeBrand, setActiveBrand] = useState("All Brands");
  const [activeSort, setActiveSort] = useState("popular");

  const filtered = MOCK_ITEMS.filter((item) => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const brandMatch = activeBrand === "All Brands" || item.brand === activeBrand;
    return catMatch && brandMatch;
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
          <div className="results-txt">{filtered.length}개 아이템</div>
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

      {/* 아이템 리스트 */}
      <div className="item-list">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted gap-2">
            <p className="text-sm">등록된 물품이 없습니다</p>
          </div>
        ) : (
          filtered.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="item-row">
              <div className="item-thumb">
                <img src={item.img} alt={item.name} />
                <div className="item-grade-badge">{item.grade}</div>
              </div>
              <div className="item-info">
                <div className="item-brand">{item.brand}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-location">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {item.area} · {item.posted}
                </div>
                <div className="item-price-row">
                  <span className="item-price">{item.price.toLocaleString()}원</span>
                  <span className="item-per">/ 4시간~</span>
                </div>
                <div className="item-stats">
                  <span className="item-stars">{item.stars}</span>
                  <span className="item-review-cnt">({item.reviewCount})</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
