"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { calcDeposit } from "@/lib/toss";
import type { TransactionStatus, TransactionRole } from "@/types/transaction";

// ── 서버용 Supabase 클라이언트 ───────────────────────────────────────
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 set 불가 — 무시
          }
        },
      },
    }
  );
}

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

// ── 액션 반환 타입 ────────────────────────────────────────────────────
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── 빌리기 요청 ──────────────────────────────────────────────────────
export async function requestTransaction(
  itemId: string,
  startDate: string,
  endDate: string,
  depositAmount: number
): Promise<ActionResult<{ transactionId: string }>> {
  const { supabase, user } = await getAuthUser();

  // 물품 소유자 확인
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("user_id, status, price_per_day")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return { success: false, error: "물품을 찾을 수 없습니다." };
  }
  if (item.status !== "available") {
    return { success: false, error: "현재 대여 불가능한 물품입니다." };
  }
  if (item.user_id === user.id) {
    return { success: false, error: "본인 물품은 빌릴 수 없습니다." };
  }

  // 보안: 클라 입력 depositAmount를 신뢰하지 않고, 방금 조회한 item.price_per_day로
  // 공용 calcDeposit(일 임대료 × 2)을 서버에서 재실행해 저장값을 확정한다.
  const verifiedDeposit = calcDeposit(item.price_per_day);
  if (depositAmount !== verifiedDeposit) {
    console.warn(
      `[requestTransaction] 클라 depositAmount(${depositAmount}) != 서버 재계산값(${verifiedDeposit}) — 서버 재계산값을 저장합니다.`
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      item_id: itemId,
      lender_id: item.user_id,
      borrower_id: user.id,
      status: "requested" as TransactionStatus,
      start_date: startDate,
      end_date: endDate,
      deposit_amount: verifiedDeposit,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "거래 요청 중 오류가 발생했습니다." };
  }

  return { success: true, data: { transactionId: data.id } };
}

// ── 대여자 수락 + 토스ID 등록 ────────────────────────────────────────
export async function acceptTransaction(
  transactionId: string,
  tossId: string
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("lender_id, status")
    .eq("id", transactionId)
    .single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.lender_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (tx.status !== "requested") return { success: false, error: "이미 처리된 요청입니다." };

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "deposit_requested" as TransactionStatus,
      toss_id: tossId.replace(/^@/, ""),
    })
    .eq("id", transactionId);

  if (error) return { success: false, error: "수락 처리 중 오류가 발생했습니다." };

  return { success: true, data: null };
}

// ── 보증금 송금 확인 (borrower) ──────────────────────────────────────
export async function confirmDeposit(
  transactionId: string
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("borrower_id, status")
    .eq("id", transactionId)
    .single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (tx.status !== "deposit_requested") return { success: false, error: "보증금 요청 상태가 아닙니다." };

  const { error } = await supabase
    .from("transactions")
    .update({ status: "deposit_confirmed" as TransactionStatus })
    .eq("id", transactionId);

  if (error) return { success: false, error: "확인 처리 중 오류가 발생했습니다." };

  return { success: true, data: null };
}

// ── 거래 사진 업로드 ─────────────────────────────────────────────────
export async function uploadTransactionPhoto(
  transactionId: string,
  photoType: "before_handover" | "after_return",
  formData: FormData
): Promise<ActionResult<{ photoId: string; signedUrl: string }>> {
  const { supabase, user } = await getAuthUser();

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "사진 파일이 없습니다." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "사진은 10MB 이하만 업로드 가능합니다." };
  }

  // 거래 당사자 확인
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("lender_id, borrower_id, status")
    .eq("id", transactionId)
    .single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.lender_id !== user.id && tx.borrower_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${transactionId}/${user.id}/${photoType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("transaction-photos")
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    return { success: false, error: "사진 업로드 중 오류가 발생했습니다." };
  }

  const { data: photoData, error: insertError } = await supabase
    .from("transaction_photos")
    .insert({
      transaction_id: transactionId,
      uploaded_by: user.id,
      photo_type: photoType,
      storage_path: storagePath,
    })
    .select("id")
    .single();

  if (insertError || !photoData) {
    return { success: false, error: "사진 기록 저장 중 오류가 발생했습니다." };
  }

  // 보안(F-GAP-02): private 버킷은 getPublicUrl 불가 — 당사자 RLS 경유 서명 URL(1h)로 교체.
  // 서명 실패가 이미 성공한 업로드를 깨지 않도록 빈 문자열 폴백.
  const { data: signed } = await supabase.storage
    .from("transaction-photos")
    .createSignedUrl(storagePath, 3600);

  return {
    success: true,
    data: { photoId: photoData.id, signedUrl: signed?.signedUrl ?? "" },
  };
}

// ── 전달 확인 (양측 모두 확인 시 handed_over로 전환) ─────────────────
export async function confirmHandover(
  transactionId: string,
  role: TransactionRole
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("lender_id, borrower_id, status, lender_confirmed_handover, borrower_confirmed_handover")
    .eq("id", transactionId)
    .single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.status !== "deposit_confirmed") return { success: false, error: "보증금 확인 후 전달 확인이 가능합니다." };

  if (role === "lender" && tx.lender_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (role === "borrower" && tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };

  const updateField = role === "lender"
    ? "lender_confirmed_handover"
    : "borrower_confirmed_handover";

  const otherConfirmed = role === "lender"
    ? tx.borrower_confirmed_handover
    : tx.lender_confirmed_handover;

  const newStatus: TransactionStatus = otherConfirmed ? "handed_over" : "deposit_confirmed";

  const { error } = await supabase
    .from("transactions")
    .update({ [updateField]: true, status: newStatus })
    .eq("id", transactionId);

  if (error) return { success: false, error: "전달 확인 중 오류가 발생했습니다." };

  return { success: true, data: null };
}

// ── 반납 확인 (양측 모두 확인 시 completed로 전환) ──────────────────
export async function confirmReturn(
  transactionId: string,
  role: TransactionRole
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("lender_id, borrower_id, status, lender_confirmed_return, borrower_confirmed_return")
    .eq("id", transactionId)
    .single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.status !== "returned" && tx.status !== "handed_over") {
    return { success: false, error: "전달 완료 후 반납 확인이 가능합니다." };
  }

  if (role === "lender" && tx.lender_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (role === "borrower" && tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };

  const updateField = role === "lender"
    ? "lender_confirmed_return"
    : "borrower_confirmed_return";

  const otherConfirmed = role === "lender"
    ? tx.borrower_confirmed_return
    : tx.lender_confirmed_return;

  const newStatus: TransactionStatus = otherConfirmed ? "completed" : "returned";

  const { error } = await supabase
    .from("transactions")
    .update({ [updateField]: true, status: newStatus })
    .eq("id", transactionId);

  if (error) return { success: false, error: "반납 확인 중 오류가 발생했습니다." };

  return { success: true, data: null };
}

// ── 거래 상세 조회 ────────────────────────────────────────────────────
export async function getTransactionDetail(transactionId: string) {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      item:items(id, title, brand, images, price_per_day),
      lender:users!transactions_lender_id_fkey(id, name, avatar_url),
      borrower:users!transactions_borrower_id_fkey(id, name, avatar_url),
      photos:transaction_photos(*)
    `)
    .eq("id", transactionId)
    .single();

  if (error || !data) return null;
  if (data.lender_id !== user.id && data.borrower_id !== user.id) return null;

  return data;
}

// ── 내 거래 목록 조회 ────────────────────────────────────────────────
export async function getMyTransactions() {
  const { supabase, user } = await getAuthUser();

  const [{ data: lending }, { data: borrowing }] = await Promise.all([
    supabase
      .from("transactions")
      .select(`
        *,
        item:items(id, title, brand, images, price_per_day),
        borrower:users!transactions_borrower_id_fkey(id, name, avatar_url)
      `)
      .eq("lender_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(`
        *,
        item:items(id, title, brand, images, price_per_day),
        lender:users!transactions_lender_id_fkey(id, name, avatar_url)
      `)
      .eq("borrower_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    lending: lending ?? [],
    borrowing: borrowing ?? [],
  };
}
