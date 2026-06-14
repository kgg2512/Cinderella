/**
 * demo.ts — 투자 PT용 데모 모드 (NEXT_PUBLIC_DEMO_MODE=true)
 *
 * 목적:
 *   투자 유치 프레젠테이션에서 로그인·DB 없이 모든 화면 플로우를 즉시 시연.
 *   실제 서비스 코드는 건드리지 않고, isDemoMode() 분기로만 가짜 데이터를 주입한다.
 *
 * 동작 원칙:
 *   - NEXT_PUBLIC_DEMO_MODE 는 빌드타임에 인라인된다(Next.js NEXT_PUBLIC_ 규칙).
 *     따라서 isDemoMode()는 SSR/CSR/번들 어디서나 동일 값을 반환한다.
 *   - 데모 모드에서 Supabase 클라이언트는 noop stub으로 대체된다(@/lib/supabase).
 *     실제 네트워크 호출은 발생하지 않는다.
 */

import type { Database } from "@/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];

/** 데모 모드 여부 — 빌드타임 인라인되므로 호출 비용 0 */
export const isDemoMode = (): boolean =>
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** 데모 로그인 사용자 (실제 인증 없이 이 값으로 가장) */
export const DEMO_USER = {
  id: "demo-user-001",
  name: "김민희",
  email: "demo@cinderella.app",
  avatar_url: "https://i.pravatar.cc/120?img=47",
};

/**
 * 데모 아이템 6개 — HomeClient의 MOCK_ITEMS와 동일 id 체계(mock-1~6)를 재사용.
 * 동일 id를 써야 상세 페이지(/items/mock-1)에서도 일관되게 조회된다.
 */
export const DEMO_ITEMS: Item[] = [
  {
    id: "mock-1",
    user_id: "demo",
    title: "Neverfull MM Monogram Canvas",
    brand: "Louis Vuitton",
    category: "bags",
    price_per_day: 28000,
    description:
      "정품 인증 완료된 네버풀 MM입니다. 데일리부터 격식 자리까지 두루 활용 가능한 시그니처 모노그램 라인.",
    images: [
      "https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=600&q=82",
    ],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    user_id: "demo",
    title: "Classic Flap Medium Caviar Black",
    brand: "Chanel",
    category: "bags",
    price_per_day: 45000,
    description:
      "캐비어 가죽 블랙 클래식 플랩 미디엄. 골드 하드웨어, 컨디션 S급. 결혼식·소개팅 인기 아이템.",
    images: [
      "https://images.unsplash.com/photo-1593418632104-71bd668d1af1?auto=format&fit=crop&w=600&q=82",
    ],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    user_id: "demo",
    title: "Birkin 30 Togo Fauve Gold HW",
    brand: "Hermès",
    category: "bags",
    price_per_day: 90000,
    description:
      "토고 레더 포브 컬러 버킨 30, 골드 하드웨어. FairyRating 최상위 인증. 특별한 날을 위한 단 하나의 선택.",
    images: [
      "https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?auto=format&fit=crop&w=600&q=82",
    ],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    user_id: "demo",
    title: "Datejust 36 Jubilee White Dial",
    brand: "Rolex",
    category: "watches",
    price_per_day: 65000,
    description:
      "데이트저스트 36 주빌레 브레이슬릿, 화이트 다이얼. 정품 보증서 동봉. 비즈니스 미팅에 완벽한 시계.",
    images: [
      "https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=600&q=82",
    ],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-5",
    user_id: "demo",
    title: "Love Necklace 18K Yellow Gold",
    brand: "Cartier",
    category: "jewelry",
    price_per_day: 35000,
    description:
      "까르띠에 러브 네클리스 18K 옐로우 골드. 정품 인증 완료. 웨딩·기념일 연출에 더없이 우아한 주얼리.",
    images: [
      "https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=600&q=82",
    ],
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-6",
    user_id: "demo",
    title: "Signoria Pump 100mm Black",
    brand: "Gucci",
    category: "shoes",
    price_per_day: 18000,
    description:
      "구찌 시뇨리아 펌프스 100mm 블랙. 사이즈 240. 한 번의 자리를 위해 부담 없이 빌려보세요.",
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=82",
    ],
    status: "available",
    created_at: new Date().toISOString(),
  },
];

/** 데모 아이템 단건 조회 헬퍼 */
export function getDemoItem(id: string): Item | null {
  return DEMO_ITEMS.find((it) => it.id === id) ?? null;
}

/** 데모 찜 목록 — DEMO_ITEMS 중 2개를 찜한 상태로 고정 */
export const DEMO_WISHLIST_ITEM_IDS = ["mock-2", "mock-3"];

/** 데모 페어리(대여자) — 채팅 상대 */
export const DEMO_FAIRY = {
  id: "demo-fairy-001",
  name: "소피아",
  avatar_url: "https://i.pravatar.cc/120?img=32",
};

/** 데모 채팅방 id (라우트: /chats/demo-chat) */
export const DEMO_CHAT_ID = "demo-chat";

/** 데모 채팅 미리 작성된 대화 3줄 */
export const DEMO_MESSAGES = [
  {
    id: "demo-msg-1",
    sender: "me" as const,
    content: "안녕하세요, Neverfull 빌리고 싶어요!",
  },
  {
    id: "demo-msg-2",
    sender: "fairy" as const,
    content: "네 물론이죠! 언제 필요하세요?",
  },
  {
    id: "demo-msg-3",
    sender: "me" as const,
    content: "이번 주말이요!",
  },
];

/** 데모 채팅 목록(1개) 표시용 메타 */
export const DEMO_CHAT_PREVIEW = {
  id: DEMO_CHAT_ID,
  fairyName: DEMO_FAIRY.name,
  itemTitle: DEMO_ITEMS[0].title,
  itemThumb: DEMO_ITEMS[0].images[0],
  lastMessage: DEMO_MESSAGES[DEMO_MESSAGES.length - 1].content,
};
