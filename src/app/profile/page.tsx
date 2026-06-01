"use client";

import Link from "next/link";

const MOCK_USER = {
  name: "강경구 님",
  email: "user@example.com · Google 계정",
  avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80",
  fairy_rating: { average: 4.9, reviewCount: 28, transactionCount: 12, responseRate: 98 },
};

const RENTAL_HISTORY = [
  {
    id: "r1", brand: "Chanel", name: "Classic Flap Medium Caviar",
    date: "2026.05.20 14:00 – 22:00", status: "active",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "r2", brand: "Louis Vuitton", name: "Neverfull MM Monogram",
    date: "2026.05.10 12:00 – 18:00", status: "done",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "r3", brand: "Rolex", name: "Datejust 36 Jubilee White Dial",
    date: "2026.04.28 15:00 – 21:00", status: "done",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80",
  },
];

const MENU_ITEMS = [
  { label: "내 물품 관리", href: "/items/new" },
  { label: "이용 내역", href: "#" },
  { label: "설정", href: "#" },
];

export default function ProfilePage() {
  const u = MOCK_USER;

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">마이페이지</div>
      </div>

      {/* 프로필 */}
      <div className="my-profile">
        <div className="my-av">
          <img src={u.avatar_url} alt={u.name} />
        </div>
        <div className="flex-1">
          <div className="my-name">{u.name}</div>
          <div className="my-email">{u.email}</div>
        </div>
        <button type="button" className="my-edit">편집</button>
      </div>

      {/* FairyRating 카드 */}
      <div className="fairy-card">
        <div className="fairy-label">FairyRating</div>
        <div className="fairy-row">
          <span className="fairy-stars">{"★".repeat(Math.round(u.fairy_rating.average))}</span>
          <span className="fairy-score">{u.fairy_rating.average}</span>
          <span className="fairy-meta">리뷰 {u.fairy_rating.reviewCount}건 · 응답률 {u.fairy_rating.responseRate}%</span>
        </div>
      </div>

      {/* 통계 */}
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-val">{u.fairy_rating.transactionCount}</div>
          <div className="stat-label">대여 횟수</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">{u.fairy_rating.average}</div>
          <div className="stat-label">평점</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">{u.fairy_rating.reviewCount}</div>
          <div className="stat-label">찜</div>
        </div>
      </div>

      {/* 역할 카드 */}
      <div className="my-role-row">
        <div className="role-card active">
          <div className="role-name">신데렐라</div>
          <div className="role-desc">명품 빌리기</div>
        </div>
        <div className="role-card">
          <div className="role-name">요정</div>
          <div className="role-desc">명품 빌려주기</div>
        </div>
      </div>

      {/* 대여 현황 */}
      <div className="my-section-title">대여 현황</div>
      {RENTAL_HISTORY.map((r) => (
        <div key={r.id} className="rental-row">
          <div className="rental-thumb">
            <img src={r.img} alt={r.name} />
          </div>
          <div className="rental-info">
            <div className="rental-brand">{r.brand}</div>
            <div className="rental-name">{r.name}</div>
            <div className="rental-date">{r.date}</div>
          </div>
          <div className={`status-pill ${r.status === "active" ? "s-active" : "s-end"}`}>
            {r.status === "active" ? "진행중" : "완료"}
          </div>
        </div>
      ))}

      {/* 메뉴 */}
      <div className="my-section-title">더보기</div>
      <div className="my-menu-list">
        {MENU_ITEMS.map(({ label, href }) => (
          <Link key={label} href={href} className="my-menu-item">
            <span className="my-menu-label">{label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A09589" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* 로그아웃 */}
      <div className="my-logout-wrap">
        <button type="button" className="my-logout-btn">로그아웃</button>
      </div>
    </div>
  );
}
