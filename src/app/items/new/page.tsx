"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ItemCategory } from "@/types";

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "bags", label: "핸드백" },
  { value: "watches", label: "시계" },
  { value: "jewelry", label: "주얼리" },
  { value: "shoes", label: "슈즈" },
  { value: "clothing", label: "의류" },
  { value: "accessories", label: "기타" },
];

const GRADES = [
  { value: "S", label: "S급", sub: "새상품급" },
  { value: "A", label: "A급", sub: "상급" },
  { value: "B", label: "B급", sub: "중급" },
  { value: "C", label: "C급", sub: "보통" },
];

export default function NewItemPage() {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState<ItemCategory>("bags");
  const [selectedGrade, setSelectedGrade] = useState("S");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const priceNum = Number(price) || 0;
  const earnDay = Math.round(priceNum * 2 * 0.85);
  const earnMonth = earnDay * 20;

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Supabase insert + Storage 업로드
    setTimeout(() => {
      setSubmitting(false);
      showToastMsg("등록이 완료되었습니다 ✓");
      setTimeout(() => router.push("/"), 1200);
    }, 800);
  };

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">내 명품 등록</div>
      </div>

      {/* 헤더 */}
      <div className="reg-header">
        <div className="reg-title">요정이 되어보세요</div>
        <div className="reg-sub">
          사용하지 않는 명품으로 수익을 만들어보세요.<br />
          FairyRating 인증 후 플랫폼에 등록되며, 정품 보증 정책이 적용됩니다.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-wrap">
        {/* 카테고리 */}
        <div className="form-group">
          <label className="form-label">카테고리</label>
          <div className="chip-row">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedCat(value)}
                className={`chip${selectedCat === value ? " sel" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 브랜드 */}
        <div className="form-group">
          <label htmlFor="brand" className="form-label">브랜드</label>
          <input id="brand" name="brand" type="text" className="form-input" placeholder="예: Chanel" />
        </div>

        {/* 상품명 */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">정식 상품명 *</label>
          <input id="title" name="title" type="text" required className="form-input" placeholder="예: Classic Flap Medium Caviar Black" />
        </div>

        {/* 상태 등급 */}
        <div className="form-group">
          <label className="form-label">상태 등급</label>
          <div className="grade-row">
            {GRADES.map(({ value, label, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedGrade(value)}
                className={`grade-btn${selectedGrade === value ? " sel" : ""}`}
              >
                {label}
                <small>{sub}</small>
              </button>
            ))}
          </div>
        </div>

        {/* 사진 */}
        <div className="form-group">
          <label className="form-label">실물 사진 (최대 5장)</label>
          <button type="button" className="upload-zone" onClick={() => showToastMsg("카메라/앨범 연결 예정")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A09589" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div className="upload-label">실물 사진 직접 촬영</div>
          </button>
        </div>

        {/* 설명 */}
        <div className="form-group">
          <label htmlFor="desc" className="form-label">설명</label>
          <textarea id="desc" name="desc" className="form-textarea" placeholder="구입 시기, 착용 횟수, 보관 상태를 자세히 적어주세요" />
        </div>

        {/* 가격 */}
        <div className="form-group">
          <label htmlFor="price" className="form-label">4시간 기준 대여료</label>
          <div className="price-inline">
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="form-input"
            />
            <span className="price-unit-txt">원 / 4시간</span>
          </div>
        </div>

        {/* 예상 수익 */}
        <div className="earn-box">
          <div className="earn-eyebrow">예상 수익 (요정 몫 85%)</div>
          <div className="earn-row">
            <div className="earn-desc">1일 (4시간×2) 기준</div>
            <div className="earn-val">₩{earnDay.toLocaleString()}</div>
          </div>
          <div className="earn-row earn-row-last">
            <div className="earn-desc">월 20일 기준</div>
            <div className="earn-val">₩{earnMonth.toLocaleString()}</div>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "등록 중..." : "등록하기"}
        </button>
      </form>

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
