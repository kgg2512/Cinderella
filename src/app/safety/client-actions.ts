/**
 * safety/client-actions.ts — UGC 신고/차단 (Google Play UGC 정책 필수 요건)
 *
 * 설계:
 *   - wishlist/chats client-actions 패턴을 그대로 따른다(getUser → supabase 호출 → ActionResult).
 *   - 데모 모드 분기는 호출하는 UI 컴포넌트가 담당한다(isDemoMode 시 이 함수 자체를 호출하지 않음).
 *     단 방어적으로 이 모듈도 supabase stub 위에서 안전하게 동작한다.
 *   - reporter_id / blocker_id 는 항상 auth.uid()(서버 RLS WITH CHECK 와 이중 방어).
 */
import { z } from "zod";
import { supabase as _supabase } from "@/lib/supabase";

// Supabase 제네릭 타입 우회(기존 패턴)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ReportTargetType = "item" | "user" | "message" | "chat";

// 신고 사유 카테고리 (UI 라벨 → 저장 코드)
export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "counterfeit", label: "가품 의심" },
  { value: "inappropriate", label: "부적절한 콘텐츠" },
  { value: "fraud", label: "사기 의심" },
  { value: "spam", label: "스팸·광고" },
  { value: "other", label: "기타" },
];

const reportSchema = z.object({
  targetType: z.enum(["item", "user", "message", "chat"]),
  targetId: z.string().min(1, "신고 대상이 올바르지 않습니다."),
  // DB CHECK(char_length BETWEEN 1 AND 50)와 이중 방어
  reason: z.string().trim().min(1, "신고 사유를 선택해주세요.").max(50),
  // DB CHECK(<=1000)와 이중 방어
  detail: z.string().trim().max(1000, "상세 내용은 1000자 이내로 입력해주세요.").optional(),
});

async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/** 신고 접수 — reporter_id는 auth.uid()로 강제 */
export async function submitReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  detail?: string;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const parsed = reportSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "잘못된 신고입니다." };
  }

  const { error } = await supabase.from("reports").insert([
    {
      reporter_id: user.id,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId,
      reason: parsed.data.reason,
      detail: parsed.data.detail && parsed.data.detail.length > 0 ? parsed.data.detail : null,
    },
  ]);

  if (error) {
    // 23505: 이미 같은 대상을 신고함 → 성공으로 간주(멱등, 중복 신고 노이즈 방지)
    if (error.code === "23505") return { success: true, data: null };
    return { success: false, error: "신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }
  return { success: true, data: null };
}

/** 유저 차단 — blocker_id는 auth.uid()로 강제, 자기 차단 방지 */
export async function blockUser(blockedId: string): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };
  if (!blockedId) return { success: false, error: "차단 대상이 올바르지 않습니다." };
  if (blockedId === user.id) return { success: false, error: "자기 자신은 차단할 수 없습니다." };

  const { error } = await supabase
    .from("blocks")
    .insert([{ blocker_id: user.id, blocked_id: blockedId }]);

  if (error) {
    // 23505: 이미 차단함 → 성공으로 간주(멱등)
    if (error.code === "23505") return { success: true, data: null };
    return { success: false, error: "차단에 실패했습니다." };
  }
  return { success: true, data: null };
}

/** 유저 차단 해제 */
export async function unblockUser(blockedId: string): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  if (error) return { success: false, error: "차단 해제에 실패했습니다." };
  return { success: true, data: null };
}

/**
 * 내가 차단한 유저 id 목록.
 * 홈/검색에서 차단 유저 아이템 비노출 필터용.
 * 실패 시 빈 배열(필터 미적용)로 폴백 — 차단 조회 실패가 목록 전체를 막지 않도록.
 */
export async function getBlockedIds(): Promise<string[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);

  if (error || !data) return [];
  return (data as { blocked_id: string }[]).map((r) => r.blocked_id);
}

/** 특정 유저를 내가 차단했는지 여부 */
export async function isBlocked(blockedId: string): Promise<boolean> {
  const user = await getAuthUser();
  if (!user || !blockedId) return false;

  const { data } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  return !!data;
}
