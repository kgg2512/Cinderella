"use client";

import Link from "next/link";

// 목업 — Supabase 연결 전 UI 확인용
const MOCK_WISHLIST = [
  { id: "w1", item: { id: "1", title: "샤넬 클래식 플랩 미디엄", brand: "Chanel", price_per_day: 50000, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"] } },
  { id: "w2", item: { id: "3", title: "롤렉스 데이트저스트", brand: "Rolex", price_per_day: 40000, images: ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80"] } },
];

export default function WishlistPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-cream border-b border-border px-4 pt-12 pb-3">
        <h1 className="text-base font-medium text-charcoal">찜 목록</h1>
      </header>

      <div className="px-4 py-4">
        {MOCK_WISHLIST.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <p className="text-sm">찜한 물품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {MOCK_WISHLIST.map(({ id, item }) => (
              <Link key={id} href={`/items/${item.id}`}>
                <div className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                  <div className="aspect-square bg-surface overflow-hidden">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gold font-medium tracking-widest uppercase mb-0.5">
                      {item.brand}
                    </p>
                    <p className="text-xs text-charcoal leading-snug line-clamp-2 mb-1">{item.title}</p>
                    <p className="text-sm font-medium text-charcoal">
                      {item.price_per_day.toLocaleString()}
                      <span className="text-[10px] text-muted font-normal ml-0.5">원/일</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
