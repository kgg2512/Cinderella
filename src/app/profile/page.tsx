"use client";

import Link from "next/link";

// 목업 — Supabase 연결 전 UI 확인용
const MOCK_USER = {
  name: "사용자",
  email: "user@example.com",
  avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80",
  fairy_rating: { average: 4.5, transaction_count: 12, response_rate: 95 },
};

const MOCK_MY_ITEMS = [
  { id: "1", title: "샤넬 클래식 플랩 미디엄", brand: "Chanel", price_per_day: 50000, status: "available", images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"] },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-cream border-b border-border px-4 pt-12 pb-3">
        <h1 className="text-base font-medium text-charcoal">마이페이지</h1>
      </header>

      <div className="px-4 py-6">
        {/* 프로필 카드 */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={MOCK_USER.avatar_url}
            alt={MOCK_USER.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-charcoal">{MOCK_USER.name}</p>
            <p className="text-xs text-muted truncate">{MOCK_USER.email}</p>
          </div>
          <button type="button" className="text-xs text-muted border border-border rounded-lg px-3 py-1.5">
            편집
          </button>
        </div>

        {/* FairyRating 카드 */}
        <div className="bg-white rounded-xl p-4 shadow-card mb-6">
          <p className="text-[10px] text-muted tracking-widest uppercase mb-3">FairyRating</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={s <= Math.round(MOCK_USER.fairy_rating.average) ? "#B8963E" : "#E8E5DF"}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <span className="text-sm font-medium text-charcoal ml-1">
                {MOCK_USER.fairy_rating.average}
              </span>
            </div>
            <span className="text-xs text-muted">거래 {MOCK_USER.fairy_rating.transaction_count}회</span>
            <span className="text-xs text-muted">응답률 {MOCK_USER.fairy_rating.response_rate}%</span>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="bg-white rounded-xl shadow-card mb-6 overflow-hidden">
          {[
            { label: "요청 현황", href: "/requests" },
            { label: "내 물품 관리", href: "#my-items" },
            { label: "설정", href: "/settings" },
          ].map(({ label, href }, i, arr) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center justify-between px-4 py-4 hover:bg-surface transition-colors ${
                i < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-sm text-charcoal">{label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8580" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* 내 물품 */}
        <div id="my-items">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-charcoal">내 물품</p>
            <Link href="/items/new" className="text-xs text-gold">
              + 등록
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_MY_ITEMS.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <div className="bg-white rounded-xl overflow-hidden shadow-card">
                  <div className="aspect-square bg-surface overflow-hidden">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gold font-medium tracking-widest uppercase mb-0.5">
                      {item.brand}
                    </p>
                    <p className="text-xs text-charcoal leading-snug line-clamp-2 mb-1">{item.title}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.status === "available"
                          ? "bg-green-50 text-green-700"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {item.status === "available" ? "대여 가능" : "대여 중"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          type="button"
          className="w-full mt-8 py-3 text-sm text-muted border border-border rounded-xl"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
