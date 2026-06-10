"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getMyChats, type ChatListRow } from "./client-actions";

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
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
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
          <div className="tx-empty-icon">💬</div>
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
