"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import {
  getChatDetail,
  getMessages,
  markMessagesRead,
  sendMessage,
  type ChatRow,
  type MessageRow,
} from "../client-actions";

const MAX_LEN = 2000;

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function ChatRoomClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // 중복 방지 append (낙관적 추가 + Realtime 수신 이중화 대비)
  const appendMessage = useCallback((msg: MessageRow) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  // 초기 로드
  useEffect(() => {
    (async () => {
      // CISO 제약 4: getUser()로 인증 확인 (getSession() 금지)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(loginPathWithNext()); return; }
      setMyId(user.id);

      const [detail, msgs] = await Promise.all([getChatDetail(id), getMessages(id)]);
      if (!detail.success) { router.replace("/chats"); return; }
      setChat(detail.data);
      if (msgs.success) setMessages(msgs.data);
      setLoading(false);

      // 입장 시 상대 메시지 읽음 처리 (실패해도 치명적이지 않음)
      markMessagesRead(id);
    })();
  }, [id, router]);

  // Realtime 구독 — RLS 적용된 INSERT만 수신됨 (비참여자 수신 불가)
  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${id}` },
        (payload: { new: MessageRow }) => {
          appendMessage(payload.new);
          // 상대가 보낸 메시지를 보고 있는 중이면 즉시 읽음 처리
          if (payload.new.sender_id !== myId) markMessagesRead(id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, myId, appendMessage]);

  // 새 메시지 도착 시 하단 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    if (content.length > MAX_LEN) {
      showToast(`메시지는 ${MAX_LEN}자 이내로 입력해주세요.`);
      return;
    }
    setSending(true);
    const result = await sendMessage(id, content);
    if (result.success) {
      setInput("");
      appendMessage(result.data);
    } else {
      showToast(result.error);
    }
    setSending(false);
  };

  if (loading || !chat || !myId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted text-sm">불러오는 중...</div>
      </div>
    );
  }

  const isOwner = chat.owner_id === myId;
  const counterpart = isOwner ? chat.borrower : chat.owner;
  const thumb = chat.item?.images?.[0];

  return (
    <div className="chat-room">
      {/* 탑바 */}
      <div className="topbar">
        <button type="button" className="topbar-icon-btn" onClick={() => router.back()} aria-label="뒤로가기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="topbar-logo">{counterpart?.name ?? "채팅"}</div>
        {!isOwner && <span className="chat-fairy-badge">페어리</span>}
      </div>

      {/* 아이템 컨텍스트 스트립 */}
      {chat.item && (
        <Link href={`/items/${chat.item.id}`} className="chat-item-strip">
          <div className="chat-item-strip-thumb">
            {thumb ? <img src={thumb} alt={chat.item.title} /> : <div className="chat-card-thumb-empty" />}
          </div>
          <div className="chat-item-strip-info">
            {chat.item.brand && <div className="chat-item-strip-brand">{chat.item.brand}</div>}
            <div className="chat-item-strip-title">{chat.item.title}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-item-strip-arrow">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* 메시지 영역 */}
      <div className="chat-msgs">
        {messages.length === 0 && (
          <div className="chat-empty-hint">
            네고, 이용 시간 등 궁금한 점을
            <br />
            거래 전에 자유롭게 물어보세요.
          </div>
        )}
        {messages.map((msg, i) => {
          const mine = msg.sender_id === myId;
          const prev = messages[i - 1];
          const showDate =
            !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
          return (
            <div key={msg.id}>
              {showDate && <div className="chat-date-label">{formatDateLabel(msg.created_at)}</div>}
              <div className={`bubble-row${mine ? " mine" : ""}`}>
                <div className={`bubble${mine ? " mine" : ""}`}>{msg.content}</div>
                <span className="bubble-time">{formatBubbleTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 바 */}
      <div className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder="메시지를 입력하세요"
          value={input}
          maxLength={MAX_LEN}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          aria-label="메시지 전송"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
