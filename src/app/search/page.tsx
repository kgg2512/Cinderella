"use client";

import { useState } from "react";
import Link from "next/link";

const MOCK_ITEMS = [
  { id: "1", title: "샤넬 클래식 플랩 미디엄", brand: "Chanel", price_per_day: 50000, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"] },
  { id: "2", title: "에르메스 버킨 35", brand: "Hermès", price_per_day: 80000, images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80"] },
  { id: "3", title: "롤렉스 데이트저스트", brand: "Rolex", price_per_day: 40000, images: ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80"] },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? MOCK_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.brand.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen">
      {/* 검색 바 */}
      <header className="sticky top-0 z-40 bg-cream border-b border-border px-4 pt-12 pb-3">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드, 물품명으로 검색"
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal placeholder:text-muted outline-none focus:border-gold transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A8580"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </header>

      <div className="px-4 py-4">
        {query.trim() === "" && (
          <p className="text-xs text-muted text-center py-12">검색어를 입력하세요</p>
        )}

        {query.trim() !== "" && results.length === 0 && (
          <p className="text-xs text-muted text-center py-12">
            &ldquo;{query}&rdquo;에 대한 결과가 없습니다
          </p>
        )}

        <div className="flex flex-col gap-3">
          {results.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="flex gap-3 bg-white rounded-xl p-3 shadow-card">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gold font-medium tracking-widest uppercase mb-0.5">
                    {item.brand}
                  </p>
                  <p className="text-sm text-charcoal leading-snug truncate">{item.title}</p>
                  <p className="text-sm font-medium text-charcoal mt-1">
                    {item.price_per_day.toLocaleString()}
                    <span className="text-[10px] text-muted font-normal ml-0.5">원/일</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
