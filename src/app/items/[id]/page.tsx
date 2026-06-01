"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const MOCK_ITEMS: Record<string, {
  id: string; brand: string; name: string; grade: string;
  price: number; stars: string; reviewCount: number;
  imgs: string[]; desc: string; specs: string[];
  area: string; owner: { name: string; rating: number; reviewCount: number; loc: string; img: string };
}> = {
  "1": {
    id: "1", brand: "Louis Vuitton", name: "Neverfull MM Monogram Canvas",
    grade: "S급", price: 28000, stars: "★★★★★", reviewCount: 47,
    imgs: [
      "https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=800&q=82",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=82",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=82",
    ],
    desc: "2022년 구입, 착용 3회 미만. LV 모노그램 캔버스 광택 살아있으며 내부 오염 없음. 소개팅·결혼식·비즈니스 미팅에 모두 어울리는 만능 클래식 토트백.",
    specs: ["S급", "모노그램 캔버스", "MM 사이즈", "올데이 토트", "정품 보증서"],
    area: "역삼동",
    owner: { name: "박지현", rating: 4.7, reviewCount: 47, loc: "역삼동 인증", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80" },
  },
  "2": {
    id: "2", brand: "Chanel", name: "Classic Flap Medium Caviar Black",
    grade: "S급", price: 45000, stars: "★★★★★", reviewCount: 62,
    imgs: [
      "https://images.unsplash.com/photo-1593418632104-71bd668d1af1?auto=format&fit=crop&w=800&q=82",
      "https://images.unsplash.com/photo-1584917865442-de89be144b2d?auto=format&fit=crop&w=800&q=82",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=82",
    ],
    desc: "2021년 구입 S급. 블랙 카비어 가죽으로 사용감 거의 없음. 골드 체인 변색 없음. 결혼식·고급 디너·VIP 파티에 완벽한 아이코닉 샤넬 클래식 플랩백.",
    specs: ["S급", "블랙 카비어 레더", "골드 하드웨어", "클래식 플랩 M", "정품 보증서"],
    area: "논현동",
    owner: { name: "김하은", rating: 5.0, reviewCount: 62, loc: "논현동 인증", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=100&q=80" },
  },
  "3": {
    id: "3", brand: "Hermès", name: "Birkin 30 Togo Fauve Gold HW",
    grade: "A급", price: 90000, stars: "★★★★☆", reviewCount: 28,
    imgs: [
      "https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?auto=format&fit=crop&w=800&q=82",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=82",
    ],
    desc: "2020년 구입 A급. 에르메스 버킨 30 토고 레더 포브 컬러. 자연스러운 그레인 살아있음. 골드 HW 완벽 유지. 세계에서 가장 아이코닉한 에르메스 버킨백.",
    specs: ["A급", "에르메스 토고 레더", "골드 HW", "버킨 30", "정품 영수증"],
    area: "청담동",
    owner: { name: "이서연", rating: 4.3, reviewCount: 28, loc: "청담동 인증", img: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=100&q=80" },
  },
};

const FALLBACK_ITEM = MOCK_ITEMS["1"];
const HOUR_OPTIONS = [4, 8, 12, 24, 48];

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedHours, setSelectedHours] = useState(4);
  const [toast, setToast] = useState("");

  const item = MOCK_ITEMS[params.id as string] ?? FALLBACK_ITEM;
  const imgs = item.imgs;
  const fee = Math.round(item.price * (selectedHours / 4) * 0.15);
  const total = item.price * (selectedHours / 4) + fee;

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
        <img src={imgs[currentImage]} alt={item.name} />

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
      </div>

      {/* 상세 바디 */}
      <div className="det-body">
        <div className="det-header">
          <div className="det-badges">
            <div className="badge-brand">{item.brand}</div>
            <div className="badge-grade">{item.grade}</div>
            <div className="badge-auth">✓ 정품 인증</div>
          </div>
          <div className="det-name">{item.name}</div>
          <div className="det-price-row">
            <div className="det-price">{item.price.toLocaleString()}원</div>
            <div className="det-per">/ 4시간~</div>
            <div className="det-price-meta">
              <span className="det-stars-txt">{item.stars}</span>
              <span className="det-review-cnt">({item.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* 판매자 */}
        <div className="seller-card">
          <div className="seller-av">
            <img src={item.owner.img} alt={item.owner.name} />
          </div>
          <div className="seller-info">
            <div className="seller-name">{item.owner.name}</div>
            <div className="seller-rating">
              <span>{"★".repeat(Math.round(item.owner.rating))}</span>
              <span className="det-review-cnt">{item.owner.rating} · {item.owner.reviewCount}건</span>
            </div>
            <div className="seller-loc-txt">{item.owner.loc}</div>
          </div>
          <button type="button" className="seller-chat-btn" onClick={() => showToastMsg("채팅 기능 준비 중입니다")}>
            채팅하기
          </button>
        </div>

        {/* 인증 박스 */}
        <div className="ins-box">
          <div className="ins-box-title">FairyRating 정품 인증 완료</div>
          <div className="ins-box-desc">이 아이템은 FairyRating 검증을 통과한 정품입니다.<br />훼손·분실 시 플랫폼 보증 정책이 적용됩니다.</div>
        </div>

        {/* 상품 정보 */}
        <div className="det-section">
          <div className="section-label">상품 정보</div>
          <div className="det-desc">{item.desc}</div>
          <div className="spec-chips">
            {item.specs.map((s) => (
              <span key={s} className="spec-chip">{s}</span>
            ))}
          </div>
        </div>
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

      {/* 예약 바텀시트 */}
      {showSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="대여 시간 선택"
          className="sheet-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSheet(false); }}
        >
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-name">{item.name}</div>
            <div className="sheet-sub">대여 시간을 선택해주세요 (최소 4시간)</div>
            <div className="flex gap-2 flex-wrap mb-5">
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHours(h)}
                  className={`hour-btn${selectedHours === h ? " sel" : ""}`}
                >
                  {h < 24 ? `${h}시간` : `${h / 24}일`}
                </button>
              ))}
            </div>
            <div className="price-sum">
              <div className="ps-row">
                <span>대여 시간</span>
                <span>{selectedHours < 24 ? `${selectedHours}시간` : `${selectedHours / 24}일`}</span>
              </div>
              <div className="ps-row">
                <span>4시간 기준 금액</span>
                <span>{item.price.toLocaleString()}원</span>
              </div>
              <div className="ps-row">
                <span>서비스 수수료 (15%)</span>
                <span>{fee.toLocaleString()}원</span>
              </div>
              <div className="ps-row ps-total">
                <span>총 결제 금액</span>
                <span>{total.toLocaleString()}원</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => { setShowSheet(false); showToastMsg("결제 기능 준비 중입니다"); }}
            >
              결제하기
            </button>
          </div>
        </div>
      )}

      {/* 토스트 */}
      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
