"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import { getMyChats, type ChatListRow } from "./client-actions";
import {
  isDemoMode,
  DEMO_USER,
  DEMO_FAIRY,
  DEMO_CHAT_ID,
  DEMO_ITEMS,
  DEMO_MESSAGES,
} from "@/lib/demo";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "어제";
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

export default function ChatsPage() {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 데모 모드: 인증·DB 호출 없이 가짜 채팅 1개 주입.
    // 데모 데이터에 new Date() 타임스탬프 포함 → lazy init 전환 시 SSR/CSR 하이드레이션 불일치.
    // 1회성 마운트 초기화이며 렌더 캐스케이드 아님 → 의도된 effect 패턴(규칙 오탐).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isDemoMode()) {
      setMyId(DEMO_USER.id);
      const lastMsg = DEMO_MESSAGES[DEMO_MESSAGES.length - 1];
      const demoChat: ChatListRow = {
        id: DEMO_CHAT_ID,
        item_id: DEMO_ITEMS[0].id,
        borrower_id: DEMO_USER.id,
        owner_id: DEMO_FAIRY.id,
        created_at: new Date().toISOString(),
        item: {
          id: DEMO_ITEMS[0].id,
          title: DEMO_ITEMS[0].title,
          brand: DEMO_ITEMS[0].brand,
          images: DEMO_ITEMS[0].images ?? [],
        },
        borrower: { id: DEMO_USER.id, name: DEMO_USER.name, avatar_url: DEMO_USER.avatar_url },
        owner: { id: DEMO_FAIRY.id, name: DEMO_FAIRY.name, avatar_url: DEMO_FAIRY.avatar_url },
        messages: [
          {
            content: lastMsg.content,
            created_at: new Date().toISOString(),
            sender_id: DEMO_USER.id,
            read_at: new Date().toISOString(),
          },
        ],
      };
      setChats([demoChat]);
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(loginPathWithNext()); return; }
      setMyId(user.id);

      const result = await getMyChats();
      if (result.success) {
        // 마지막 메시지 시간순 정렬 (메시지 없는 방은 생성순)
        const sorted = [...result.data].sort((a, b) => {
          const ta = a.messages?.[0]?.created_at ?? a.created_at;
          const tb = b.messages?.[0]?.created_at ?? b.created_at;
          return tb.localeCompare(ta);
        });
        setChats(sorted);
      }
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="min-h-screen pb-20">
      <div className="topbar">
        <div className="topbar-logo">채팅</div>
      </div>

      {loading ? (
        <div className="tx-empty">
          <div className="tx-empty-icon">...</div>
          <div>불러오는 중</div>
        </div>
      ) : chats.length === 0 ? (
        <div className="tx-empty">
          <div className="tx-empty-icon">✦</div>
          <div>
            아직 채팅이 없습니다.
            <br />
            마음에 드는 아이템의 페어리에게 문의해보세요.
          </div>
        </div>
      ) : (
        chats.map((chat) => {
          const isOwner = chat.owner_id === myId;
          const counterpart = isOwner ? chat.borrower : chat.owner;
          const last = chat.messages?.[0];
          const thumb = chat.item?.images?.[0];
          const hasUnread = !!last && last.sender_id !== myId && !last.read_at;

          return (
            <Link key={chat.id} href={`/chats/${chat.id}`} className="chat-card">
              <div className="chat-card-thumb">
                {thumb ? (
                  <img src={thumb} alt={chat.item?.title ?? "물품"} />
                ) : (
                  <div className="chat-card-thumb-empty" />
                )}
              </div>
              <div className="chat-card-info">
                <div className="chat-card-top">
                  <span className="chat-card-name">{counterpart?.name ?? "알 수 없음"}</span>
                  <span className="chat-card-role">{isOwner ? "문의" : "페어리"}</span>
                </div>
                <div className="chat-card-item">{chat.item?.title ?? "물품"}</div>
                <div className={`chat-card-last${hasUnread ? " unread" : ""}`}>
                  {last ? last.content : "아직 메시지가 없습니다."}
                </div>
              </div>
              <div className="chat-card-meta">
                <span className="chat-card-time">{formatTime(last?.created_at ?? chat.created_at)}</span>
                {hasUnread && <span className="chat-unread-dot" aria-label="읽지 않은 메시지" />}
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
