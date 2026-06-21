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
import type { TransactionWithDetails } from "@/types/transaction";

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

/** 데모 페어리(대여자) — 1번 채팅 상대 */
export const DEMO_FAIRY = {
  id: "demo-fairy-001",
  name: "소피아",
  avatar_url: "https://i.pravatar.cc/120?img=32",
};

/** 데모 페어리 2 — 2번 채팅/거래 상대 */
export const DEMO_FAIRY_2 = {
  id: "demo-fairy-002",
  name: "지우",
  avatar_url: "https://i.pravatar.cc/120?img=45",
};

/** 데모 신데렐라(차용자) — 내가 페어리일 때 거래 상대 */
export const DEMO_CINDERELLA = {
  id: "demo-cinderella-001",
  name: "하은",
  avatar_url: "https://i.pravatar.cc/120?img=20",
};

export type DemoMessage = { id: string; sender: "me" | "fairy"; content: string };

/** 1번 대화 — 소피아 ↔ 나, Neverfull 렌탈 전 과정(발견→가격/보증금→정품→직거래 약속) */
const DEMO_CHAT_1_MESSAGES: DemoMessage[] = [
  { id: "c1-1", sender: "me", content: "안녕하세요, Neverfull MM 빌리고 싶어요! 이번 주말 친구 결혼식이 있어서요 ✨" },
  { id: "c1-2", sender: "fairy", content: "안녕하세요 민희님 😊 네버풀 지금 대여 가능해요! 토요일 오전부터 필요하실까요?" },
  { id: "c1-3", sender: "me", content: "네! 토요일 오전 10시부터 일요일 저녁까지 가능할까요?" },
  { id: "c1-4", sender: "fairy", content: "그럼요. 1박 2일 5만원이고 보증금은 30만원이에요. 반납 시 전액 돌려드려요!" },
  { id: "c1-5", sender: "me", content: "좋아요 :) 정품 보증서도 같이 주시나요?" },
  { id: "c1-6", sender: "fairy", content: "네, 구매 영수증이랑 정품 인증서 함께 드려요. FairyRating 최상위라 안심하셔도 돼요 💛" },
  { id: "c1-7", sender: "me", content: "믿음이 가네요! 강남역에서 직거래 가능하실까요?" },
  { id: "c1-8", sender: "fairy", content: "토요일 오전 9시 30분 강남역 11번 출구 어떠세요?" },
  { id: "c1-9", sender: "me", content: "완벽해요! 그때 뵐게요 😊 빌리기 요청 보냈습니다!" },
];

/** 2번 대화 — 지우 ↔ 나, Datejust 시계 보증금 단계까지 진행 */
const DEMO_CHAT_2_MESSAGES: DemoMessage[] = [
  { id: "c2-1", sender: "me", content: "안녕하세요! 데이트저스트 36 다음 주 화요일 비즈니스 미팅에 빌릴 수 있을까요?" },
  { id: "c2-2", sender: "fairy", content: "안녕하세요 😊 화요일 하루 대여 가능합니다. 정품 보증서랑 박스 함께 드려요." },
  { id: "c2-3", sender: "me", content: "좋네요! 보증금은 얼마인가요?" },
  { id: "c2-4", sender: "fairy", content: "50만원이고 반납 확인 후 바로 돌려드려요. 토스로 보내주시면 됩니다 🙏" },
  { id: "c2-5", sender: "me", content: "방금 보증금 보냈어요! 확인 부탁드려요 :)" },
];

/** 레거시 호환 — 기본(1번) 대화 메시지 */
export const DEMO_MESSAGES = DEMO_CHAT_1_MESSAGES;

/** 기본 데모 채팅방 id */
export const DEMO_CHAT_ID = "demo-chat-1";

export interface DemoChat {
  id: string;
  fairy: { id: string; name: string; avatar_url: string };
  item: Item;
  messages: DemoMessage[];
}

/** 데모 채팅 목록 — 2개 대화방 (마켓이 살아있음을 시연) */
export const DEMO_CHATS: DemoChat[] = [
  { id: "demo-chat-1", fairy: DEMO_FAIRY, item: getDemoItem("mock-1")!, messages: DEMO_CHAT_1_MESSAGES },
  { id: "demo-chat-2", fairy: DEMO_FAIRY_2, item: getDemoItem("mock-4")!, messages: DEMO_CHAT_2_MESSAGES },
];

/** 데모 채팅방 단건 조회 (없으면 1번 폴백) */
export function getDemoChat(id: string): DemoChat {
  return DEMO_CHATS.find((c) => c.id === id) ?? DEMO_CHATS[0];
}

// ── 데모 거래(Transaction) 데이터 ───────────────────────────────────────────
// 렌탈 마켓의 핵심 = 거래 루프. 투자자에게 "브라우즈→채팅→빌리기→거래진행→완료"의
// 완결 스토리를 보여주기 위해 전 상태(요청·보증금·대여중·완료·반납)를 망라한다.
// 날짜/created_at은 고정 문자열 — SSR/CSR 하이드레이션 드리프트 방지.

function txItemRef(id: string) {
  const it = getDemoItem(id)!;
  return { id: it.id, title: it.title, brand: it.brand, images: it.images, price_per_day: it.price_per_day };
}
function txUserRef(u: { id: string; name: string; avatar_url: string }) {
  return { id: u.id, name: u.name, avatar_url: u.avatar_url };
}
const ME_REF = { id: DEMO_USER.id, name: DEMO_USER.name, avatar_url: DEMO_USER.avatar_url };

/**
 * 데모 거래 5건.
 *  - 내가 빌린 것(borrower=나): tx-1 대여중 / tx-2 보증금요청 / tx-3 거래완료
 *  - 내가 빌려준 것(lender=나): tx-4 빌리기요청 / tx-5 반납됨
 */
export const DEMO_TRANSACTIONS: TransactionWithDetails[] = [
  {
    id: "demo-tx-1",
    item_id: "mock-1",
    lender_id: DEMO_FAIRY.id,
    borrower_id: DEMO_USER.id,
    status: "handed_over",
    start_date: "2026-06-21",
    end_date: "2026-06-23",
    deposit_amount: 300000,
    toss_id: "sophia_lux",
    lender_confirmed_handover: true,
    borrower_confirmed_handover: true,
    lender_confirmed_return: false,
    borrower_confirmed_return: false,
    created_at: "2026-06-20T09:00:00.000Z",
    updated_at: "2026-06-21T01:00:00.000Z",
    item: txItemRef("mock-1"),
    lender: txUserRef(DEMO_FAIRY),
    borrower: ME_REF,
  },
  {
    id: "demo-tx-2",
    item_id: "mock-4",
    lender_id: DEMO_FAIRY_2.id,
    borrower_id: DEMO_USER.id,
    status: "deposit_requested",
    start_date: "2026-06-30",
    end_date: "2026-06-30",
    deposit_amount: 500000,
    toss_id: "jiwoo_watch",
    lender_confirmed_handover: false,
    borrower_confirmed_handover: false,
    lender_confirmed_return: false,
    borrower_confirmed_return: false,
    created_at: "2026-06-21T12:00:00.000Z",
    updated_at: "2026-06-21T12:30:00.000Z",
    item: txItemRef("mock-4"),
    lender: txUserRef(DEMO_FAIRY_2),
    borrower: ME_REF,
  },
  {
    id: "demo-tx-3",
    item_id: "mock-2",
    lender_id: DEMO_FAIRY.id,
    borrower_id: DEMO_USER.id,
    status: "completed",
    start_date: "2026-06-07",
    end_date: "2026-06-09",
    deposit_amount: 400000,
    toss_id: "sophia_lux",
    lender_confirmed_handover: true,
    borrower_confirmed_handover: true,
    lender_confirmed_return: true,
    borrower_confirmed_return: true,
    created_at: "2026-06-06T09:00:00.000Z",
    updated_at: "2026-06-09T18:00:00.000Z",
    item: txItemRef("mock-2"),
    lender: txUserRef(DEMO_FAIRY),
    borrower: ME_REF,
  },
  {
    id: "demo-tx-4",
    item_id: "mock-3",
    lender_id: DEMO_USER.id,
    borrower_id: DEMO_CINDERELLA.id,
    status: "requested",
    start_date: "2026-06-25",
    end_date: "2026-06-26",
    deposit_amount: 700000,
    toss_id: null,
    lender_confirmed_handover: false,
    borrower_confirmed_handover: false,
    lender_confirmed_return: false,
    borrower_confirmed_return: false,
    created_at: "2026-06-22T08:30:00.000Z",
    updated_at: "2026-06-22T08:30:00.000Z",
    item: txItemRef("mock-3"),
    lender: ME_REF,
    borrower: txUserRef(DEMO_CINDERELLA),
  },
  {
    id: "demo-tx-5",
    item_id: "mock-5",
    lender_id: DEMO_USER.id,
    borrower_id: DEMO_CINDERELLA.id,
    status: "returned",
    start_date: "2026-06-14",
    end_date: "2026-06-16",
    deposit_amount: 250000,
    toss_id: "minhee_k",
    lender_confirmed_handover: true,
    borrower_confirmed_handover: true,
    lender_confirmed_return: false,
    borrower_confirmed_return: true,
    created_at: "2026-06-13T09:00:00.000Z",
    updated_at: "2026-06-16T20:00:00.000Z",
    item: txItemRef("mock-5"),
    lender: ME_REF,
    borrower: txUserRef(DEMO_CINDERELLA),
  },
];

/** 내가 빌린 거래 (borrower=나) — 최신순 */
export const DEMO_BORROWING = DEMO_TRANSACTIONS.filter((t) => t.borrower_id === DEMO_USER.id);
/** 내가 빌려준 거래 (lender=나) — 최신순 */
export const DEMO_LENDING = DEMO_TRANSACTIONS.filter((t) => t.lender_id === DEMO_USER.id);

/** 데모 거래 단건 조회 */
export function getDemoTransaction(id: string): TransactionWithDetails | null {
  return DEMO_TRANSACTIONS.find((t) => t.id === id) ?? null;
}

/** 진행 중(완료 제외) 거래 — 마이페이지 "대여 현황"/"들어온 요청"용 */
const ACTIVE_TX_STATUSES = ["requested", "deposit_requested", "deposit_confirmed", "handed_over", "returned"];
export const DEMO_ACTIVE_BORROWING = DEMO_BORROWING.filter((t) => ACTIVE_TX_STATUSES.includes(t.status));
export const DEMO_ACTIVE_LENDING = DEMO_LENDING.filter((t) => ACTIVE_TX_STATUSES.includes(t.status));

/** 내가 페어리로서 등록한 물품 (마이페이지 페어리 모드 "내 물품") */
export const DEMO_MY_ITEMS = [getDemoItem("mock-3")!, getDemoItem("mock-5")!].map((it) => ({
  id: it.id,
  title: it.title,
  brand: it.brand,
  price_per_day: it.price_per_day,
  images: it.images,
  status: "available",
}));
