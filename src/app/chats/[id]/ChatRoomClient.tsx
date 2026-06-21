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
import { submitReport, blockUser } from "@/app/safety/client-actions";
import ReportSheet from "@/components/ReportSheet";
import { isDemoMode, DEMO_USER, getDemoChat } from "@/lib/demo";

const demo = isDemoMode();

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
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
    // 데모 모드: 인증·DB·Realtime 없이 미리 작성된 대화 3줄 주입.
    // 데모 메시지에 Date.now() 타임스탬프 포함 → lazy init 전환 시 SSR/CSR 하이드레이션 불일치.
    // 1회성 마운트 초기화이며 렌더 캐스케이드 아님 → 의도된 effect 패턴(규칙 오탐).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (demo) {
      const dchat = getDemoChat(id);
      const baseTime = Date.now() - dchat.messages.length * 60000;
      setMyId(DEMO_USER.id);
      setChat({
        id: dchat.id,
        item_id: dchat.item.id,
        borrower_id: DEMO_USER.id,
        owner_id: dchat.fairy.id,
        created_at: new Date(baseTime).toISOString(),
        item: {
          id: dchat.item.id,
          title: dchat.item.title,
          brand: dchat.item.brand,
          images: dchat.item.images ?? [],
        },
        borrower: { id: DEMO_USER.id, name: DEMO_USER.name, avatar_url: DEMO_USER.avatar_url },
        owner: { id: dchat.fairy.id, name: dchat.fairy.name, avatar_url: dchat.fairy.avatar_url },
      });
      setMessages(
        dchat.messages.map((m, i) => ({
          id: m.id,
          chat_id: dchat.id,
          sender_id: m.sender === "me" ? DEMO_USER.id : dchat.fairy.id,
          content: m.content,
          created_at: new Date(baseTime + i * 60000).toISOString(),
          read_at: new Date().toISOString(),
        })),
      );
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

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
    if (demo) return; // 데모 모드: Realtime 구독 없음

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
    // 데모 모드: DB 없이 로컬에 메시지 추가
    if (demo) {
      appendMessage({
        id: `demo-msg-${Date.now()}`,
        chat_id: id,
        sender_id: DEMO_USER.id,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
      });
      setInput("");
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

  // 상대방 id 계산 (신고/차단 대상) — chat 로드 후에만 유효
  const counterpartId =
    chat && myId ? (chat.owner_id === myId ? chat.borrower_id : chat.owner_id) : null;

  const handleReportSubmit = async (reason: string, detail: string) => {
    setMenuOpen(false);
    // 데모 모드: no-op + 토스트
    if (demo) {
      setShowReport(false);
      showToast("데모: 신고가 접수되었습니다");
      return;
    }
    if (!counterpartId) return;

    setReporting(true);
    const result = await submitReport({
      targetType: "user",
      targetId: counterpartId,
      reason,
      detail,
    });
    setReporting(false);
    setShowReport(false);
    showToast(result.success ? "신고가 접수되었습니다" : result.error);
  };

  const handleBlock = async () => {
    setMenuOpen(false);
    // 데모 모드: no-op + 토스트 (채팅 목록 복귀까지 동일 UX)
    if (demo) {
      showToast("데모: 차단되었습니다");
      setTimeout(() => router.push("/chats"), 1200);
      return;
    }
    if (!counterpartId || blocking) return;

    setBlocking(true);
    const result = await blockUser(counterpartId);
    setBlocking(false);
    if (result.success) {
      showToast("차단되었습니다");
      // 차단 후 채팅 목록으로 복귀 — getMyChats가 차단 상대와의 채팅을 목록에서 제외함
      setTimeout(() => router.push("/chats"), 1000);
    } else {
      showToast(result.error);
    }
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

        {/* 더보기 메뉴 — 상대방 신고/차단 (UGC 정책) */}
        <div className="chat-more-wrap">
          <button
            type="button"
            className="chat-more-btn"
            aria-label="채팅 메뉴"
            aria-haspopup="menu"
            aria-expanded={menuOpen ? "true" : "false"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <>
              {/* 메뉴 바깥 클릭 닫기용 투명 오버레이 */}
              <button
                type="button"
                aria-label="메뉴 닫기"
                className="chat-more-backdrop"
                onClick={() => setMenuOpen(false)}
              />
              <div className="chat-more-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowReport(true);
                  }}
                >
                  상대방 신고
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="danger"
                  onClick={handleBlock}
                  disabled={blocking}
                >
                  {blocking ? "차단 중..." : "상대방 차단"}
                </button>
              </div>
            </>
          )}
        </div>
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

      <ReportSheet
        open={showReport}
        title="상대방 신고"
        submitting={reporting}
        onClose={() => setShowReport(false)}
        onSubmit={handleReportSubmit}
      />

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
