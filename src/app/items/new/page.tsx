"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import { isDemoMode } from "@/lib/demo";
import type { ItemCategory } from "@/types";
import { submitItem } from "./client-actions";
import type { SubmitItemResult } from "./client-actions";

const demo = isDemoMode();

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCat, setSelectedCat] = useState<ItemCategory>("bags");
  const [selectedGrade, setSelectedGrade] = useState("S");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    // 데모 모드: 인증 체크 스킵 (폼은 비활성 상태로 노출)
    if (demo) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(loginPathWithNext());
    });
  }, [router]);

  const priceNum = Number(price) || 0;
  const earnDay = Math.round(priceNum * 2 * 0.85);
  const earnMonth = earnDay * 20;

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const combined = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(combined);

    // 기존 URL 해제
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const urls = combined.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 데모 모드: 실제 등록 없이 안내 토스트만
    if (demo) {
      showToastMsg("데모: 실제 서비스에서 페어리로 등록하고 수익을 만드세요");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("category", selectedCat);
    formData.set("grade", selectedGrade);

    // 이미지 파일 추가
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    const result: SubmitItemResult = await submitItem(formData);

    setSubmitting(false);
    if (result.success) {
      showToastMsg(result.message);
      // 생성된 아이템 상세 페이지로 이동
      setTimeout(() => router.push(`/items/${result.itemId}`), 1200);
    } else {
      if (typeof result.errors === "object") {
        setFieldErrors(result.errors as Record<string, string[]>);
        const firstMsg = Object.values(result.errors as Record<string, string[]>)[0]?.[0];
        if (firstMsg) showToastMsg(firstMsg);
      } else {
        showToastMsg(result.errors as string);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">내 명품 등록</div>
      </div>

      {/* 헤더 */}
      <div className="reg-header">
        <div className="reg-title">페어리가 되어보세요</div>
        <div className="reg-sub">
          사용하지 않는 명품으로 수익을 만들어보세요.<br />
          등록한 물품은 페어리들에게 공개됩니다. 진품 여부는 대여자가 표명하며, 위조품 등록은 금지됩니다.
        </div>
      </div>

      {/* 데모 모드: 폼 비활성 안내 배너 */}
      {demo && (
        <div className="demo-notice">
          ✦ 실제 서비스에서 페어리로 등록하고 수익을 만드세요 ✦
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-wrap">
        <fieldset disabled={demo} className="contents">
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
          {fieldErrors.brand && <p className="form-error">{fieldErrors.brand[0]}</p>}
        </div>

        {/* 상품명 */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">정식 상품명 *</label>
          <input id="title" name="title" type="text" required className="form-input" placeholder="예: Classic Flap Medium Caviar Black" />
          {fieldErrors.title && <p className="form-error">{fieldErrors.title[0]}</p>}
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

        {/* 사진 업로드 */}
        <div className="form-group">
          <label className="form-label">실물 사진 (최대 5장)</label>

          {/* 미리보기 그리드 */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previewUrls.map((url, i) => (
                <div key={url} className="relative aspect-square">
                  <img src={url} alt={`미리보기 ${i + 1}`} className="w-full h-full object-cover rounded-md" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
                    aria-label="이미지 삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {previewUrls.length < 5 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
                aria-label="사진 선택"
              />
              <button
                type="button"
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A09589" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div className="upload-label">
                  {previewUrls.length > 0 ? `${previewUrls.length}/5장 선택됨 · 추가하기` : "사진 선택 (카메라/앨범)"}
                </div>
              </button>
            </>
          )}
        </div>

        {/* 설명 */}
        <div className="form-group">
          <label htmlFor="desc" className="form-label">설명</label>
          <textarea id="desc" name="desc" className="form-textarea" placeholder="구입 시기, 착용 횟수, 보관 상태를 자세히 적어주세요" />
          {fieldErrors.desc && <p className="form-error">{fieldErrors.desc[0]}</p>}
        </div>

        {/* 가격 */}
        <div className="form-group">
          <label htmlFor="price" className="form-label">4시간 기준 대여료</label>
          <div className="price-inline">
            <input
              id="price"
              name="price"
              type="number"
              min={1000}
              step={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="최소 1,000원"
              className="form-input"
            />
            <span className="price-unit-txt">원 / 4시간</span>
          </div>
          {fieldErrors.price && <p className="form-error">{fieldErrors.price[0]}</p>}
        </div>

        {/* 예상 수익 */}
        <div className="earn-box">
          <div className="earn-eyebrow">예상 수익 (페어리 몫 85%)</div>
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
        </fieldset>
      </form>

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
