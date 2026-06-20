"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestTransaction } from "@/app/transactions/client-actions";
import { addWishlist, removeWishlist, checkWishlisted } from "@/app/wishlist/client-actions";
import { getOrCreateChat } from "@/app/chats/client-actions";
import { calcDeposit } from "@/lib/toss";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import { isDemoMode, DEMO_USER, DEMO_CHAT_ID } from "@/lib/demo";

const demo = isDemoMode();

type ItemRow = Database["public"]["Tables"]["items"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface Item extends ItemRow {
  owner?: UserRow | null;
}

interface Props {
  item: Item;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ItemDetailClient({ item }: Props) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  // 데모는 빌드 상수(isDemoMode 인라인) → lazy init이 SSR/CSR 동일값이라 하이드레이션 안전.
  const [wishlistLoading, setWishlistLoading] = useState(!demo);
  const [showSheet, setShowSheet] = useState(false);
  const [myId, setMyId] = useState<string | null>(demo ? DEMO_USER.id : null);
  const [chatOpening, setChatOpening] = useState(false);

  useEffect(() => {
    // 데모 모드: 초기 상태를 위 useState lazy init으로 이미 주입함 → effect는 비데모 DB 경로만.
    if (demo) return;

    // wishlistLoading 초기값이 이미 true(!demo)이고 페이지는 item별 remount → 동기 리셋 불요.
    checkWishlisted(item.id).then((v) => {
      setWishlisted(v);
      setWishlistLoading(false);
    });
    // CISO 제약 4: getUser() 사용 (비로그인도 상세 열람 가능 — 실패 시 null 유지)
    supabase.auth.getUser().then(({ data: { user } }) => setMyId(user?.id ?? null));
  }, [item.id]);
  const [toast, setToast] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(tomorrow());
  const [requesting, setRequesting] = useState(false);

  const imgs = item.images ?? [];
  const depositAmount = calcDeposit(item.price_per_day);

  const handleRequestTransaction = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      showToastMsg("날짜를 올바르게 선택해주세요.");
      return;
    }

    // 데모 모드: 실제 거래 생성 없이 2초 후 성공 토스트 + 시트 닫기
    if (demo) {
      setRequesting(true);
      setTimeout(() => {
        setRequesting(false);
        setShowSheet(false);
        showToastMsg("데모: 실제 서비스에서 렌탈이 시작됩니다");
      }, 2000);
      return;
    }

    setRequesting(true);
    const result = await requestTransaction(item.id, startDate, endDate, depositAmount);
    setRequesting(false);
    if (result.success) {
      setShowSheet(false);
      router.push(`/transactions/${result.data.transactionId}`);
    } else {
      showToastMsg(result.error);
    }
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleChatOpen = async () => {
    if (chatOpening) return;

    // 데모 모드: 데모 채팅방으로 직행
    if (demo) {
      router.push(`/chats/${DEMO_CHAT_ID}`);
      return;
    }

    setChatOpening(true);
    const result = await getOrCreateChat(item.id);
    setChatOpening(false);
    if (result.success) {
      router.push(`/chats/${result.data.chatId}`);
    } else {
      showToastMsg(result.error);
    }
  };

  const toggleWish = () => {
    // 데모 모드: DB 호출 없이 로컬 state만 토글 (토스트는 동일하게 표시)
    if (demo) {
      if (wishlisted) {
        setWishlisted(false);
        showToastMsg("찜 해제됐습니다");
      } else {
        setWishlisted(true);
        showToastMsg("찜 목록에 추가됐습니다");
      }
      return;
    }

    if (wishlisted) {
      setWishlisted(false);
      showToastMsg("찜 해제됐습니다");
      removeWishlist(item.id).then((r) => { if (!r.success) setWishlisted(true); });
    } else {
      setWishlisted(true);
      showToastMsg("찜 목록에 추가됐습니다");
      addWishlist(item.id).then((r) => { if (!r.success) setWishlisted(false); });
    }
  };

  return (
    <div className="min-h-screen">
      {/* 이미지 캐러셀 */}
      <div className="detail-img-wrap">
        {imgs.length > 0 ? (
          <img
            src={imgs[currentImage]}
            alt={`${item.brand ? item.brand + " " : ""}${item.title} — ${currentImage + 1}번째 이미지`}
            loading={currentImage === 0 ? "eager" : "lazy"}
            width={860}
            height={860}
          />
        ) : (
          <div className="w-full h-full bg-[#F3F0EB] flex items-center justify-center text-[#A09589] text-sm">
            사진 없음
          </div>
        )}

        <button type="button" className="det-back" aria-label="뒤로가기" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1816" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button type="button" className="det-wish" aria-label={wishlisted ? "찜 해제" : "찜하기"} onClick={toggleWish} disabled={wishlistLoading}>
          {wishlistLoading ? "♡" : wishlisted ? "♥" : "♡"}
        </button>

        {imgs.length > 1 && (
          <>
            <button
              type="button"
              className="img-nav img-prev"
              aria-label="이전 이미지"
              onClick={() => setCurrentImage((i) => Math.max(0, i - 1))}
            >
              ‹
            </button>
            <button
              type="button"
              className="img-nav img-next"
              aria-label="다음 이미지"
              onClick={() => setCurrentImage((i) => Math.min(imgs.length - 1, i + 1))}
            >
              ›
            </button>
          </>
        )}

        {imgs.length > 1 && (
          <div className="img-dots">
            {imgs.map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`이미지 ${i + 1}`}
                onClick={() => setCurrentImage(i)}
                className={`dot${i === currentImage ? " on" : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 상세 바디 */}
      <div className="det-body">
        <div className="det-header">
          <div className="det-badges">
            {item.brand && <div className="badge-brand">{item.brand}</div>}
            <div className="badge-grade">{item.status}</div>
            <div className="badge-auth">✓ 정품 인증</div>
          </div>
          <div className="det-name">{item.title}</div>
          <div className="det-price-row">
            <div className="det-price">{item.price_per_day.toLocaleString()}원</div>
            <div className="det-per">/ 4시간~</div>
          </div>
        </div>

        {/* 판매자 */}
        {item.owner && (
          <div className="seller-card">
            <div className="seller-av">
              {item.owner.avatar_url ? (
                <img
                  src={item.owner.avatar_url}
                  alt={`${item.owner.name ?? "페어리"} 프로필 사진`}
                  loading="lazy"
                  width={44}
                  height={44}
                />
              ) : (
                <div className="w-full h-full bg-[#E8E3DC] flex items-center justify-center text-[#A09589] text-lg">
                  {(item.owner.name ?? "?")[0]}
                </div>
              )}
            </div>
            <div className="seller-info">
              <div className="seller-name">{item.owner.name ?? "페어리"}</div>
              <div className="seller-loc-txt">인증 페어리</div>
            </div>
            {myId !== item.user_id && (
              <button type="button" className="seller-chat-btn" onClick={handleChatOpen} disabled={chatOpening}>
                {chatOpening ? "여는 중..." : "페어리에게 문의하기"}
              </button>
            )}
          </div>
        )}

        {/* 인증 박스 */}
        <div className="ins-box">
          <div className="ins-box-title">FairyRating 정품 인증 완료</div>
          <div className="ins-box-desc">이 아이템은 FairyRating 검증을 통과한 정품입니다.<br />훼손·분실 시 플랫폼 보증 정책이 적용됩니다.</div>
        </div>

        {/* 상품 정보 */}
        {item.description && (
          <div className="det-section">
            <div className="section-label">상품 정보</div>
            <div className="det-desc">{item.description}</div>
          </div>
        )}
        <div className="det-spacer" />
      </div>

      {/* 하단 CTA */}
      <div className="det-cta">
        <button type="button" className="cta-wish" aria-label={wishlisted ? "찜 해제" : "찜하기"} onClick={toggleWish} disabled={wishlistLoading}>
          {wishlistLoading ? "♡" : wishlisted ? "♥" : "♡"}
        </button>
        <button type="button" className="cta-rent" onClick={() => setShowSheet(true)}>
          지금 빌리기
        </button>
      </div>

      {/* 빌리기 요청 바텀시트 */}
      {showSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="빌리기 요청"
          className="sheet-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSheet(false); }}
        >
          <div className="date-sheet">
            <div className="sheet-handle" />
            <div className="sheet-name">{item.title}</div>
            <div className="sheet-sub">안전한 거래를 시작합니다</div>

            <div className="date-input-row">
              <div>
                <label htmlFor="rent-start-date" className="date-input-label">대여 시작일</label>
                <input
                  id="rent-start-date"
                  type="date"
                  className="date-input"
                  value={startDate}
                  min={today()}
                  title="대여 시작일"
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="rent-end-date" className="date-input-label">반납일</label>
                <input
                  id="rent-end-date"
                  type="date"
                  className="date-input"
                  value={endDate}
                  min={startDate || today()}
                  title="반납일"
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="deposit-summary-box">
              <div className="deposit-summary-row">
                <span>일 임대료</span>
                <span>{item.price_per_day.toLocaleString()}원</span>
              </div>
              <div className="deposit-summary-row">
                <span>보증금 (일 임대료 × 2)</span>
                <span className="deposit-summary-total">₩{depositAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="deposit-notice-box deposit-notice-box--sheet">
              <p className="deposit-notice-line">
                신데렐라의 모든 거래는 보증금 직거래 방식으로 진행됩니다.
                대여자가 수락하면 토스로 보증금을 전송하고, 물건을 받으시면 됩니다.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={requesting || !startDate || !endDate || startDate > endDate}
              onClick={handleRequestTransaction}
            >
              {requesting ? "요청 중..." : "빌리기 요청하기"}
            </button>
          </div>
        </div>
      )}

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
