"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ItemCategory } from "@/types";

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "bags", label: "가방" },
  { value: "clothing", label: "의류" },
  { value: "shoes", label: "슈즈" },
  { value: "accessories", label: "액세서리" },
  { value: "jewelry", label: "주얼리" },
  { value: "watches", label: "시계" },
  { value: "other", label: "기타" },
];

export default function NewItemPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    brand: "",
    category: "bags" as ItemCategory,
    price_per_day: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Supabase insert + Storage 업로드
    setTimeout(() => {
      setSubmitting(false);
      router.push("/");
    }, 800);
  };

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-cream border-b border-border px-4 pt-12 pb-3 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1816" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-medium text-charcoal">물품 등록</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-6 flex flex-col gap-5">
        {/* 이미지 업로드 */}
        <div>
          <label className="block text-xs text-muted mb-2 tracking-wide uppercase">사진</label>
          <div className="w-full aspect-square max-h-40 bg-surface border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A8580" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-xs text-muted">사진 추가 (최대 5장)</p>
          </div>
        </div>

        {/* 브랜드 */}
        <div>
          <label htmlFor="brand" className="block text-xs text-muted mb-1.5 tracking-wide uppercase">
            브랜드
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            value={form.brand}
            onChange={handleChange}
            placeholder="예: Chanel, Hermès"
            className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-muted outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-xs text-muted mb-1.5 tracking-wide uppercase">
            물품명 <span className="text-gold">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="예: 샤넬 클래식 플랩 미디엄"
            className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-muted outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label htmlFor="category" className="block text-xs text-muted mb-1.5 tracking-wide uppercase">
            카테고리
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-charcoal outline-none focus:border-gold transition-colors appearance-none"
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 가격 */}
        <div>
          <label htmlFor="price_per_day" className="block text-xs text-muted mb-1.5 tracking-wide uppercase">
            1일 대여 가격 <span className="text-gold">*</span>
          </label>
          <div className="relative">
            <input
              id="price_per_day"
              name="price_per_day"
              type="number"
              required
              min={0}
              value={form.price_per_day}
              onChange={handleChange}
              placeholder="0"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 pr-10 text-sm text-charcoal placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted">원</span>
          </div>
          <p className="text-[10px] text-muted mt-1">0원이면 무료 대여입니다.</p>
        </div>

        {/* 설명 */}
        <div>
          <label htmlFor="description" className="block text-xs text-muted mb-1.5 tracking-wide uppercase">
            상태 설명
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="물품 상태, 구매 시기, 포함 구성품 등을 자유롭게 적어주세요."
            className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-muted outline-none focus:border-gold transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-charcoal text-cream py-4 rounded-xl text-sm font-medium tracking-wide hover:bg-gold transition-colors disabled:opacity-60"
        >
          {submitting ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
}
