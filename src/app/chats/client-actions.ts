import { z } from "zod";
import { supabase as _supabase } from "@/lib/supabase";

// Supabase 제네릭 타입이 join payload를 과도하게 좁히는 문제 — untyped 클라이언트로 우회 (기존 패턴)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// CISO 제약 3: content 길이 제한 ≤ 2000자 + 클라이언트단 Zod 검증 (DB CHECK와 이중 방어)
const messageContentSchema = z
  .string()
  .trim()
  .min(1, "메시지를 입력해주세요.")
  .max(2000, "메시지는 2000자 이내로 입력해주세요.");

export interface ChatProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface ChatItem {
  id: string;
  title: string;
  brand: string | null;
  images: string[];
}

export interface ChatRow {
  id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  created_at: string;
  item?: ChatItem | null;
  borrower?: ChatProfile | null;
  owner?: ChatProfile | null;
}

export interface ChatListRow extends ChatRow {
  messages?: { content: string; created_at: string; sender_id: string; read_at: string | null }[];
}

export interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

// CISO 제약 4: getUser() 사용 (getSession() 금지)
async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

const CHAT_SELECT = `
  id, item_id, borrower_id, owner_id, created_at,
  item:items(id, title, brand, images),
  borrower:users!chats_borrower_id_fkey(id, name, avatar_url),
  owner:users!chats_owner_id_fkey(id, name, avatar_url)
`;

/** 아이템 기준 기존 채팅 입장 또는 신규 생성 (차용자 전용) */
export async function getOrCreateChat(itemId: string): Promise<ActionResult<{ chatId: string }>> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data: item, error: itemError } = await supabase
    .from("items").select("user_id").eq("id", itemId).single();

  if (itemError || !item) return { success: false, error: "물품을 찾을 수 없습니다." };
  if (item.user_id === user.id) return { success: false, error: "본인 물품에는 문의할 수 없습니다." };

  // 차단한 유저의 물품에는 신규 채팅 생성 불가 (UGC 차단 효과)
  // RLS상 본인 blocks만 조회되므로 "내가 상대를 차단한" 경우를 막는다.
  const { data: blocked } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", item.user_id)
    .maybeSingle();
  if (blocked) return { success: false, error: "차단한 페어리에게는 문의할 수 없습니다." };

  // 기존 채팅 확인 (UNIQUE(item_id, borrower_id))
  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .eq("item_id", itemId)
    .eq("borrower_id", user.id)
    .maybeSingle();

  if (existing) return { success: true, data: { chatId: existing.id } };

  const { data: created, error: insertError } = await supabase
    .from("chats")
    .insert({ item_id: itemId, borrower_id: user.id, owner_id: item.user_id })
    .select("id")
    .single();

  if (insertError) {
    // 23505: 동시 생성 race — 재조회로 회수
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("chats")
        .select("id")
        .eq("item_id", itemId)
        .eq("borrower_id", user.id)
        .maybeSingle();
      if (raced) return { success: true, data: { chatId: raced.id } };
    }
    return { success: false, error: "채팅방 생성 중 오류가 발생했습니다." };
  }

  return { success: true, data: { chatId: created.id } };
}

/** 내 채팅 목록 (마지막 메시지 1건 포함, 최신순) */
export async function getMyChats(): Promise<ActionResult<ChatListRow[]>> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data, error } = await supabase
    .from("chats")
    .select(`${CHAT_SELECT}, messages(content, created_at, sender_id, read_at)`)
    .or(`borrower_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });

  if (error) return { success: false, error: "채팅 목록을 불러오지 못했습니다." };

  // UGC 차단 효과: 내가 차단한 상대와의 채팅은 목록에서 제외(클릭/메시지 노출 차단).
  // blocks 조회 실패(마이그레이션 미적용 등) 시 빈 집합 → 목록 전체를 막지 않음(graceful).
  const { data: blockedRows } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  const blockedIds = new Set(
    ((blockedRows ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id),
  );

  const rows = ((data ?? []) as ChatListRow[]).filter((c) => {
    const otherId = c.borrower_id === user.id ? c.owner_id : c.borrower_id;
    return !blockedIds.has(otherId);
  });

  return { success: true, data: rows };
}

/** 채팅방 상세 (참여자 검증은 RLS가 수행 — 비참여자는 row 자체가 안 보임) */
export async function getChatDetail(chatId: string): Promise<ActionResult<ChatRow>> {
  try { await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data, error } = await supabase
    .from("chats").select(CHAT_SELECT).eq("id", chatId).single();

  if (error || !data) return { success: false, error: "채팅방을 찾을 수 없습니다." };
  return { success: true, data: data as ChatRow };
}

/** 메시지 목록 (오래된 순) */
export async function getMessages(chatId: string): Promise<ActionResult<MessageRow[]>> {
  try { await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, sender_id, content, created_at, read_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) return { success: false, error: "메시지를 불러오지 못했습니다." };
  return { success: true, data: (data ?? []) as MessageRow[] };
}

/** 메시지 전송 — Zod 검증 + sender_id는 auth.uid()로 강제 (RLS WITH CHECK 이중 방어) */
export async function sendMessage(chatId: string, content: string): Promise<ActionResult<MessageRow>> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const parsed = messageContentSchema.safeParse(content);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "잘못된 메시지입니다." };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: user.id, content: parsed.data })
    .select("id, chat_id, sender_id, content, created_at, read_at")
    .single();

  if (error || !data) return { success: false, error: "메시지 전송에 실패했습니다." };
  return { success: true, data: data as MessageRow };
}

/** 상대방이 보낸 미읽음 메시지 읽음 처리 (RLS: 수신자만 갱신 가능) */
export async function markMessagesRead(chatId: string): Promise<ActionResult> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) return { success: false, error: "읽음 처리에 실패했습니다." };
  return { success: true, data: null };
}
