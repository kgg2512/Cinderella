"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BRANDS = ["All", "Louis Vuitton", "Chanel", "Hermès", "Dior", "Gucci", "Cartier", "Rolex", "Valentino"];

const ALL_ITEMS = [
  { id: "1", brand: "Louis Vuitton", name: "Neverfull MM Monogram Canvas", price: 28000, img: "https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=400&q=82", area: "역삼동", stars: "★★★★★", reviewCount: 47 },
  { id: "2", brand: "Chanel", name: "Classic Flap Medium Caviar Black", price: 45000, img: "https://images.unsplash.com/photo-1593418632104-71bd668d1af1?auto=format&fit=crop&w=400&q=82", area: "논현동", stars: "★★★★★", reviewCount: 62 },
  { id: "3", brand: "Hermès", name: "Birkin 30 Togo Fauve Gold HW", price: 90000, img: "https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?auto=format&fit=crop&w=400&q=82", area: "청담동", stars: "★★★★☆", reviewCount: 28 },
  { id: "4", brand: "Dior", name: "Lady Dior Medium Cannage Black", price: 52000, img: "https://images.unsplash.com/photo-1584917865442-de89be144b2d?auto=format&fit=crop&w=400&q=82", area: "청담동", stars: "★★★★★", reviewCount: 41 },
  { id: "5", brand: "Rolex", name: "Datejust 36 Jubilee White Dial", price: 65000, img: "https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=400&q=82", area: "청담동", stars: "★★★★★", reviewCount: 22 },
  { id: "6", brand: "Cartier", name: "Love Necklace 18K Yellow Gold", price: 35000, img: "https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=400&q=82", area: "도산공원", stars: "★★★★★", reviewCount: 53 },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");

  const results = ALL_ITEMS.filter((item) => {
    const q = query.trim().toLowerCase();
    const brandMatch = activeBrand === "All" || item.brand === activeBrand;
    const queryMatch = q === "" || item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
    return brandMatch && queryMatch;
  });

  const showEmpty = query.trim() === "" && activeBrand === "All";

  return (
    <div className="min-h-screen">
      {/* 검색 탑바 */}
      <div className="topbar">
        <div className="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A09589" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="search-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드, 상품명 검색"
            autoFocus
          />
        </div>
        <button type="button" className="search-cancel-btn" onClick={() => router.back()}>
          취소
        </button>
      </div>

      {/* 브랜드 필터 */}
      <div className="filter-section-notop">
        <div className="brand-pills-pt">
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
          <div className="results-txt">{showEmpty ? "검색어를 입력하세요" : `${results.length}개 아이템`}</div>
        </div>
      </div>

      {/* 결과 리스트 */}
      <div className="item-list">
        {showEmpty ? (
          <div className="flex flex-col items-center py-16 gap-3 text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-sm">브랜드 또는 상품명을 검색해보세요</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-muted">
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          results.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="item-row">
              <div className="item-thumb">
                <img src={item.img} alt={item.name} />
              </div>
              <div className="item-info">
                <div className="item-brand">{item.brand}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-location">{item.area}</div>
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
