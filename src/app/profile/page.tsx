"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const MENU_ITEMS = [
  { label: "내 물품 관리", href: "/items/my" },
  { label: "이용 내역", href: "/transactions" },
  { label: "설정", href: "/settings" },
];

// 진행 중 거래 상태 (completed, cancelled, disputed 제외)
const ACTIVE_STATUSES = ["requested", "deposit_requested", "deposit_confirmed", "handed_over", "returned"];

interface ActiveTx {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  item?: { title: string; brand: string | null; images: string[] } | null;
}

const STATUS_LABEL: Record<string, string> = {
  requested: "요청됨",
  deposit_requested: "보증금 요청",
  deposit_confirmed: "보증금 확인",
  handed_over: "전달됨",
  returned: "반납됨",
};

const STATUS_CSS: Record<string, string> = {
  requested: "s-requested",
  deposit_requested: "s-deposit-requested",
  deposit_confirmed: "s-deposit-confirmed",
  handed_over: "s-handed-over",
  returned: "s-returned",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [rentalCount, setRentalCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [activeTxs, setActiveTxs] = useState<ActiveTx[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const u = session.user;
      setUser(u);

      // 병렬 조회: 완료 거래 수, 찜 수, 진행 중 거래
      const [completedRes, wishRes, activeTxRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("borrower_id", u.id)
          .eq("status", "completed"),
        supabase
          .from("wishlist")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id),
        supabase
          .from("transactions")
          .select(`
            id, status, start_date, end_date,
            item:items(title, brand, images)
          `)
          .eq("borrower_id", u.id)
          .in("status", ACTIVE_STATUSES)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (!completedRes.error) setRentalCount(completedRes.count ?? 0);
      if (!wishRes.error) setWishCount(wishRes.count ?? 0);
      if (!activeTxRes.error) setActiveTxs((activeTxRes.data ?? []) as ActiveTx[]);

      setLoading(false);
    })();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="profile-loading-wrap">
        <div className="profile-loading-txt">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "사용자";
  const displayEmail = user.email ?? "";
  const avatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80";

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">마이페이지</div>
      </div>

      {/* 프로필 */}
      <div className="my-profile">
        <div className="my-av">
          <img src={avatarUrl} alt={displayName} />
        </div>
        <div className="flex-1">
          <div className="my-name">{displayName}</div>
          <div className="my-email">{displayEmail} · Google 계정</div>
        </div>
        <button
          type="button"
          className="my-edit"
          onClick={() => router.push("/settings")}
        >
          편집
        </button>
      </div>

      {/* FairyRating 카드 */}
      <div className="fairy-card">
        <div className="fairy-label">FairyRating</div>
        <div className="fairy-row">
          <span className="fairy-stars">{"★".repeat(5)}</span>
          <span className="fairy-score">신규</span>
          <span className="fairy-meta">첫 거래를 시작해보세요</span>
        </div>
      </div>

      {/* 통계 — Supabase 실데이터 */}
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-val">{rentalCount}</div>
          <div className="stat-label">대여 횟수</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">신규</div>
          <div className="stat-label">평점</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">{wishCount}</div>
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

      {/* 대여 현황 — Supabase 실데이터 */}
      <div className="my-section-title">대여 현황</div>
      {activeTxs.length === 0 ? (
        <div className="rental-empty">
          <div className="rental-empty-icon">✦</div>
          <div className="rental-empty-text">아직 대여 내역이 없어요</div>
          <div className="rental-empty-sub">첫 거래를 시작해보세요</div>
        </div>
      ) : (
        activeTxs.map((tx) => {
          const thumb = tx.item?.images?.[0];
          return (
            <Link key={tx.id} href={`/transactions/${tx.id}`} className="rental-row">
              <div className="rental-thumb">
                {thumb ? (
                  <img src={thumb} alt={tx.item?.title ?? "물품"} />
                ) : (
                  <div className="rental-thumb" />
                )}
              </div>
              <div className="rental-info">
                {tx.item?.brand && (
                  <div className="rental-brand">{tx.item.brand}</div>
                )}
                <div className="rental-name">{tx.item?.title ?? "물품"}</div>
                <div className="rental-date">
                  {tx.start_date} ~ {tx.end_date}
                </div>
              </div>
              <span className={`status-pill ${STATUS_CSS[tx.status] ?? "s-requested"}`}>
                {STATUS_LABEL[tx.status] ?? tx.status}
              </span>
            </Link>
          );
        })
      )}

      {/* 메뉴 */}
      <div className="my-section-title">더보기</div>
      <div className="my-menu-list">
        {MENU_ITEMS.map(({ label, href }) => (
          <Link key={label} href={href} className="my-menu-item">
            <span className="my-menu-label">{label}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A09589"
              strokeWidth="1.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* 로그아웃 */}
      <div className="my-logout-wrap">
        <button
          type="button"
          className="my-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </div>
    </div>
  );
}
