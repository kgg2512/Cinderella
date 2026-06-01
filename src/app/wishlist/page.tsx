"use client";

import { useState } from "react";
import Link from "next/link";

const INITIAL_WISHLIST = [
  {
    id: "w1",
    item: {
      id: "1", brand: "Louis Vuitton", name: "Neverfull MM Monogram Canvas",
      price: 28000, grade: "S급",
      img: "https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=400&q=82",
      area: "역삼동", stars: "★★★★★", reviewCount: 47,
    },
  },
  {
    id: "w2",
    item: {
      id: "2", brand: "Chanel", name: "Classic Flap Medium Caviar Black",
      price: 45000, grade: "S급",
      img: "https://images.unsplash.com/photo-1593418632104-71bd668d1af1?auto=format&fit=crop&w=400&q=82",
      area: "논현동", stars: "★★★★★", reviewCount: 62,
    },
  },
  {
    id: "w3",
    item: {
      id: "5", brand: "Cartier", name: "Love Necklace 18K Yellow Gold",
      price: 35000, grade: "S급",
      img: "https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=400&q=82",
      area: "도산공원", stars: "★★★★★", reviewCount: 53,
    },
  },
];

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(INITIAL_WISHLIST);

  const remove = (id: string) => setWishlist((prev) => prev.filter((w) => w.id !== id));

  return (
    <div className="min-h-screen">
      {/* 탑바 */}
      <div className="topbar">
        <div className="topbar-logo">좋아요</div>
      </div>

      {wishlist.length === 0 ? (
        <div className="wish-empty">
          <div className="wish-empty-icon">♡</div>
          <div className="wish-empty-txt">
            아직 찜한 아이템이 없습니다.<br />마음에 드는 명품을 찜해보세요.
          </div>
        </div>
      ) : (
        <div className="item-list">
          {wishlist.map(({ id, item }) => (
            <div key={id} className="wish-item-row">
              <Link href={`/items/${item.id}`} className="wish-item-link">
                <div className="item-thumb">
                  <img src={item.img} alt={item.name} />
                  <div className="item-grade-badge">{item.grade}</div>
                </div>
                <div className="item-info">
                  <div className="item-brand">{item.brand}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-location">{item.area}</div>
                  <div className="item-price-row">
                    <span className="item-price">{item.price.toLocaleString()}원</span>
                    <span className="item-per">/ 4시간~</span>
                  </div>
                  <div className="item-stats">
                    <span className="item-stars">{item.stars}</span>
                    <span className="item-review-cnt">({item.reviewCount})</span>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                aria-label="찜 해제"
                onClick={() => remove(id)}
                className="wish-remove-btn"
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
