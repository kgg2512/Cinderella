"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestTransaction } from "@/app/transactions/actions";
import { calcDeposit } from "@/lib/toss";
import type { Database } from "@/types/database";

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
  const [showSheet, setShowSheet] = useState(false);
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

  const toggleWish = () => {
    setWishlisted((v) => !v);
    showToastMsg(wishlisted ? "찜 해제됐습니다" : "찜 목록에 추가됐습니다");
  };

  return (
    <div className="min-h-screen">
      {/* 이미지 캐러셀 */}
      <div className="detail-img-wrap">
        {imgs.length > 0 ? (
          <img src={imgs[currentImage]} alt={item.title} />
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

        <button type="button" className="det-wish" aria-label={wishlisted ? "찜 해제" : "찜하기"} onClick={toggleWish}>
          {wishlisted ? "♥" : "♡"}
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
                <img src={item.owner.avatar_url} alt={item.owner.name ?? "판매자"} />
              ) : (
                <div className="w-full h-full bg-[#E8E3DC] flex items-center justify-center text-[#A09589] text-lg">
                  {(item.owner.name ?? "?")[0]}
                </div>
              )}
            </div>
            <div className="seller-info">
              <div className="seller-name">{item.owner.name ?? "판매자"}</div>
              <div className="seller-loc-txt">인증 판매자</div>
            </div>
            <button type="button" className="seller-chat-btn" onClick={() => showToastMsg("채팅 기능 준비 중입니다")}>
              채팅하기
            </button>
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
        <button type="button" className="cta-wish" aria-label={wishlisted ? "찜 해제" : "찜하기"} onClick={toggleWish}>
          {wishlisted ? "♥" : "♡"}
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
