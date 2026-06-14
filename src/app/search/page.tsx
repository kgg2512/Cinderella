"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import { isDemoMode, DEMO_ITEMS } from "@/lib/demo";

type Item = Database["public"]["Tables"]["items"]["Row"];

const BRANDS = ["All", "Louis Vuitton", "Chanel", "Hermès", "Dior", "Gucci", "Cartier", "Rolex", "Valentino"];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string, brand: string) => {
    const trimmed = q.trim();
    if (trimmed === "" && brand === "All") {
      setResults([]);
      return;
    }

    setLoading(true);

    // 데모 모드: DEMO_ITEMS에서 키워드/브랜드 필터 (DB 호출 없음)
    if (isDemoMode()) {
      const kw = trimmed.toLowerCase();
      const filtered = DEMO_ITEMS.filter((it) => {
        if (brand !== "All" && it.brand !== brand) return false;
        if (kw === "") return true;
        return (
          it.title.toLowerCase().includes(kw) ||
          (it.brand ?? "").toLowerCase().includes(kw)
        );
      });
      setResults(filtered);
      setLoading(false);
      return;
    }

    let dbQuery = supabase
      .from("items")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(50);

    if (brand !== "All") {
      dbQuery = dbQuery.eq("brand", brand);
    }
    if (trimmed !== "") {
      dbQuery = dbQuery.or(`title.ilike.%${trimmed}%,brand.ilike.%${trimmed}%`);
    }

    const { data } = await dbQuery;
    setResults(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, activeBrand), 300);
    return () => clearTimeout(timer);
  }, [query, activeBrand, doSearch]);

  const showEmpty = query.trim() === "" && activeBrand === "All";

  return (
    <div className="min-h-screen">
      {/* 검색 탑바 */}
      <div className="topbar">
        <div className="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A09589" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="search-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드, 상품명 검색"
            autoFocus
          />
        </div>
        <button type="button" className="search-cancel-btn" onClick={() => router.back()}>
          취소
        </button>
      </div>

      {/* 브랜드 필터 */}
      <div className="filter-section-notop">
        <div className="brand-pills-pt">
          {BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setActiveBrand(b)}
              className={`brand-pill${activeBrand === b ? " active" : ""}`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="sort-row">
          <div className="results-txt">
            {showEmpty ? "검색어를 입력하세요" : loading ? "검색 중..." : `${results.length}개 아이템`}
          </div>
        </div>
      </div>

      {/* 결과 리스트 */}
      <div className="item-list">
        {showEmpty ? (
          <div className="flex flex-col items-center py-16 gap-3 text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-sm">브랜드 또는 상품명을 검색해보세요</p>
          </div>
        ) : results.length === 0 && !loading ? (
          <div className="flex flex-col items-center py-16 gap-2 text-muted">
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          results.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="item-row">
              <div className="item-thumb">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} />
                ) : (
                  <div className="w-full h-full bg-[#F3F0EB] flex items-center justify-center text-[#A09589] text-xs">
                    사진 없음
                  </div>
                )}
              </div>
              <div className="item-info">
                <div className="item-brand">{item.brand ?? ""}</div>
                <div className="item-name">{item.title}</div>
                <div className="item-price-row">
                  <span className="item-price">{item.price_per_day.toLocaleString()}원</span>
                  <span className="item-per">/ 4시간~</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
