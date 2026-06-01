"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// 목업 — Supabase 연결 전 UI 확인용
const MOCK_ITEM = {
  id: "1",
  title: "샤넬 클래식 플랩 미디엄",
  brand: "Chanel",
  category: "bags",
  price_per_day: 50000,
  description:
    "2023년 구매한 샤넬 클래식 플랩 미디엄입니다. 블랙 캐비어 가죽, 골드 하드웨어. 박스, 더스트백, 정품 보증서 포함. 흠집 없이 깨끗하게 사용했습니다.",
  images: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
  ],
  status: "available",
  owner: {
    id: "owner1",
    name: "소유자 A",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
  },
  fairy_rating: { average: 4.8, total_reviews: 23, transaction_count: 31, response_rate: 98 },
};

export default function ItemDetailPage() {
  const params = useParams();
  const [currentImage, setCurrentImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const item = MOCK_ITEM; // TODO: Supabase에서 params.id로 조회

  return (
    <div className="min-h-screen">
      {/* 이미지 슬라이더 */}
      <div className="relative aspect-square bg-surface overflow-hidden">
        <img
          src={item.images[currentImage]}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {/* 이미지 인디케이터 */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {item.images.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentImage ? "bg-gold" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
        {/* 찜 버튼 */}
        <button
          type="button"
          onClick={() => setWishlisted((v) => !v)}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-card"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={wishlisted ? "#B8963E" : "none"}
            stroke={wishlisted ? "#B8963E" : "#1A1816"}
            strokeWidth="1.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="absolute top-3 left-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1816" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      <div className="px-4 py-4">
        {/* 브랜드 + 제목 */}
        <p className="text-xs text-gold font-medium tracking-widest uppercase mb-1">{item.brand}</p>
        <h2 className="text-lg text-charcoal font-normal leading-snug mb-1">{item.title}</h2>
        <p className="text-xl font-medium text-charcoal mb-4">
          {item.price_per_day.toLocaleString()}
          <span className="text-xs text-muted font-normal ml-1">원 / 일</span>
        </p>

        <div className="gold-divider mb-4" />

        {/* FairyRating */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={s <= Math.round(item.fairy_rating.average) ? "#B8963E" : "#E8E5DF"}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span className="text-xs text-charcoal ml-1">{item.fairy_rating.average}</span>
          </div>
          <span className="text-xs text-muted">거래 {item.fairy_rating.transaction_count}회</span>
          <span className="text-xs text-muted">응답률 {item.fairy_rating.response_rate}%</span>
        </div>

        {/* 소유자 */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={item.owner.avatar_url}
            alt={item.owner.name}
            className="w-9 h-9 rounded-full object-cover"
          />
          <div>
            <p className="text-xs font-medium text-charcoal">{item.owner.name}</p>
            <p className="text-[10px] text-muted">소유자</p>
          </div>
        </div>

        <div className="gold-divider mb-4" />

        {/* 설명 */}
        <p className="text-sm text-charcoal leading-relaxed mb-6">{item.description}</p>

        {/* 렌탈 요청 버튼 */}
        <button
          type="button"
          className="w-full bg-charcoal text-cream py-4 rounded-xl text-sm font-medium tracking-wide hover:bg-gold transition-colors"
        >
          렌탈 요청하기
        </button>
      </div>
    </div>
  );
}
