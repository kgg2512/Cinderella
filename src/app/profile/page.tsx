"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import {
  isDemoMode,
  DEMO_USER,
  DEMO_ACTIVE_BORROWING,
  DEMO_ACTIVE_LENDING,
  DEMO_MY_ITEMS,
} from "@/lib/demo";
import type { User } from "@supabase/supabase-js";

const MENU_ITEMS = [
  { label: "내 물품 관리", href: "/items/my" },
  { label: "이용 내역", href: "/transactions" },
  { label: "설정", href: "/settings" },
];

// 진행 중 거래 상태 (completed, cancelled, disputed 제외)
const ACTIVE_STATUSES = ["requested", "deposit_requested", "deposit_confirmed", "handed_over", "returned"];

// 역할 모드 localStorage 키 (재방문 시 유지)
const ROLE_STORAGE_KEY = "cinderella_role_mode";

type RoleMode = "cinderella" | "fairy";

interface ActiveTx {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  item?: { title: string; brand: string | null; images: string[] } | null;
}

interface MyItemRow {
  id: string;
  title: string;
  brand: string | null;
  price_per_day: number;
  images: string[];
  status: string;
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

/**
 * 페어리 온도 (신뢰도 지표)
 * 기본 36.5 + 완료 거래(차용·대여 모두) 1건당 +1.5, 상한 99.
 * DB 변경 없음 — 기존 transactions 테이블 집계만 사용.
 */
function calcTemperature(completedCount: number): number {
  return Math.min(99, 36.5 + completedCount * 1.5);
}

function tempEmoji(t: number): string {
  if (t < 38) return "🙂";
  if (t < 45) return "😊";
  if (t < 60) return "😍";
  return "🔥";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<RoleMode>("cinderella");
  const [rentalCount, setRentalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [activeTxs, setActiveTxs] = useState<ActiveTx[]>([]);
  const [myItems, setMyItems] = useState<MyItemRow[]>([]);
  const [incomingTxs, setIncomingTxs] = useState<ActiveTx[]>([]);

  useEffect(() => {
    // 아래 동기 setState는 (a) localStorage 등 클라이언트 전용 값 복원 → 하이드레이션 후 설정이 정답,
    // (b) 데모 1회성 마운트 초기화. 둘 다 렌더 캐스케이드 아님 → 의도된 effect 패턴(규칙 오탐).
    /* eslint-disable react-hooks/set-state-in-effect */
    // 저장된 역할 모드 복원 (재방문 시 유지)
    try {
      const saved = window.localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === "fairy" || saved === "cinderella") setRole(saved);
    } catch {
      // localStorage 접근 불가 환경(시크릿 등)은 기본값 유지
    }

    // 데모 모드: 인증·DB 호출 없이 DEMO_USER + 가짜 통계 주입
    if (isDemoMode()) {
      setUser({
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        user_metadata: {
          full_name: DEMO_USER.name,
          name: DEMO_USER.name,
          avatar_url: DEMO_USER.avatar_url,
        },
      } as unknown as User);
      setRentalCount(4);
      setCompletedCount(8);
      setWishCount(2);
      // 진행 중 거래 주입 — "대여 횟수 4" ↔ "대여 내역 없음" 모순 제거
      setActiveTxs(DEMO_ACTIVE_BORROWING as unknown as ActiveTx[]);
      setMyItems(DEMO_MY_ITEMS as unknown as MyItemRow[]);
      setIncomingTxs(DEMO_ACTIVE_LENDING as unknown as ActiveTx[]);
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    (async () => {
      const {
        data: { user: u },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !u) {
        router.replace(loginPathWithNext());
        return;
      }
      setUser(u);

      // 병렬 조회: 완료 거래(온도), 찜 수, 진행 중 거래(신데렐라), 내 물품·들어온 요청(페어리)
      const [completedRes, wishRes, activeTxRes, myItemsRes, incomingRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, borrower_id, lender_id")
          .eq("status", "completed")
          .or(`borrower_id.eq.${u.id},lender_id.eq.${u.id}`),
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
        supabase
          .from("items")
          .select("id, title, brand, price_per_day, images, status")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("transactions")
          .select(`
            id, status, start_date, end_date,
            item:items(title, brand, images)
          `)
          .eq("lender_id", u.id)
          .in("status", ACTIVE_STATUSES)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (!completedRes.error) {
        const rows = (completedRes.data ?? []) as { borrower_id: string; lender_id: string }[];
        setCompletedCount(rows.length);
        setRentalCount(rows.filter((r) => r.borrower_id === u.id).length);
      }
      if (!wishRes.error) setWishCount(wishRes.count ?? 0);
      if (!activeTxRes.error) setActiveTxs((activeTxRes.data ?? []) as ActiveTx[]);
      if (!myItemsRes.error) setMyItems((myItemsRes.data ?? []) as MyItemRow[]);
      if (!incomingRes.error) setIncomingTxs((incomingRes.data ?? []) as ActiveTx[]);

      setLoading(false);
    })();
  }, [router]);

  const switchRole = (next: RoleMode) => {
    setRole(next);
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, next);
    } catch {
      // 저장 실패해도 화면 전환은 유지
    }
  };

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

  // 데모 모드: 페어리 온도 87.0도 고정 (시연용 신뢰도 어필)
  const temperature = isDemoMode() ? 87 : calcTemperature(completedCount);
  const tempDisplay = temperature.toFixed(1);

  const renderTxRow = (tx: ActiveTx) => {
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
          {tx.item?.brand && <div className="rental-brand">{tx.item.brand}</div>}
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
  };

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

      {/* 페어리 온도 — 신뢰도 지표 (완료 거래 기반) */}
      <div className="my-temp-card">
        <div className="my-temp-row">
          <div className="my-temp-num">{tempDisplay}°</div>
          <div className="my-temp-emoji">{tempEmoji(temperature)}</div>
          <div className="my-temp-label">
            페어리 온도
            <br />
            <span className="my-temp-sub">신뢰도 지표</span>
          </div>
        </div>
        <div className="my-temp-bar-wrap">
          <div className="my-temp-bar" style={{ width: `${temperature}%` }} />
        </div>
      </div>

      {/* 역할 전환 — 신데렐라(빌리기) ↔ 페어리(빌려주기) */}
      <div className="my-role-row">
        <button
          type="button"
          className={`role-card${role === "cinderella" ? " active" : ""}`}
          onClick={() => switchRole("cinderella")}
        >
          <div className="role-icon">👗</div>
          <div className="role-name">신데렐라</div>
          <div className="role-desc">명품 빌리기</div>
        </button>
        <button
          type="button"
          className={`role-card${role === "fairy" ? " active" : ""}`}
          onClick={() => switchRole("fairy")}
        >
          <div className="role-icon">✨</div>
          <div className="role-name">페어리</div>
          <div className="role-desc">명품 빌려주기</div>
        </button>
      </div>

      {/* 통계 — Supabase 실데이터 */}
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-val">{rentalCount}</div>
          <div className="stat-label">대여 횟수</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">{completedCount > 0 ? tempDisplay + "°" : "신규"}</div>
          <div className="stat-label">평점</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">{wishCount}</div>
          <div className="stat-label">찜</div>
        </div>
      </div>

      {role === "cinderella" ? (
        <>
          {/* 신데렐라 모드 — 빌린 것 중심 */}
          <div className="my-section-title">대여 현황</div>
          {activeTxs.length === 0 ? (
            <div className="rental-empty">
              <div className="rental-empty-icon">✦</div>
              <div className="rental-empty-text">아직 대여 내역이 없어요</div>
              <div className="rental-empty-sub">마음에 드는 명품으로 첫 거래를 시작해보세요</div>
            </div>
          ) : (
            activeTxs.map(renderTxRow)
          )}
        </>
      ) : (
        <>
          {/* 페어리 모드 — 내 물품 + 들어온 거래 요청 중심 */}
          <div className="my-section-title my-section-title--row">
            내 물품
            <Link href="/items/my" className="my-section-more">
              전체 보기
            </Link>
          </div>
          {myItems.length === 0 ? (
            <div className="rental-empty">
              <div className="rental-empty-icon">✦</div>
              <div className="rental-empty-text">아직 등록한 물품이 없어요</div>
              <div className="rental-empty-sub">사용하지 않는 명품으로 수익을 만들어보세요</div>
              <Link href="/items/new" className="rental-empty-cta">
                물품 등록하기
              </Link>
            </div>
          ) : (
            myItems.map((item) => {
              const thumb = item.images?.[0];
              const isAvailable = item.status === "available";
              return (
                <Link key={item.id} href={`/items/${item.id}`} className="rental-row">
                  <div className="rental-thumb">
                    {thumb ? (
                      <img src={thumb} alt={item.title} />
                    ) : (
                      <div className="rental-thumb" />
                    )}
                  </div>
                  <div className="rental-info">
                    {item.brand && <div className="rental-brand">{item.brand}</div>}
                    <div className="rental-name">{item.title}</div>
                    <div className="rental-date">
                      {item.price_per_day.toLocaleString()}원 / 일
                    </div>
                  </div>
                  <span className={`status-pill ${isAvailable ? "s-deposit-confirmed" : "s-requested"}`}>
                    {isAvailable ? "공개" : "숨김"}
                  </span>
                </Link>
              );
            })
          )}

          <div className="my-section-title">들어온 거래 요청</div>
          {incomingTxs.length === 0 ? (
            <div className="rental-empty">
              <div className="rental-empty-icon">✦</div>
              <div className="rental-empty-text">아직 들어온 요청이 없어요</div>
              <div className="rental-empty-sub">물품을 공개하면 신데렐라들의 요청이 도착합니다</div>
            </div>
          ) : (
            incomingTxs.map(renderTxRow)
          )}
        </>
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
