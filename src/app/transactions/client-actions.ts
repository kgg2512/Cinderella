import { supabase as _supabase } from "@/lib/supabase";
import { calcDeposit } from "@/lib/toss";
import type { TransactionStatus, TransactionRole } from "@/types/transaction";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

export async function requestTransaction(
  itemId: string,
  startDate: string,
  endDate: string,
  depositAmount: number
): Promise<ActionResult<{ transactionId: string }>> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data: item, error: itemError } = await supabase
    .from("items").select("user_id, status, price_per_day").eq("id", itemId).single();

  if (itemError || !item) return { success: false, error: "물품을 찾을 수 없습니다." };
  if (item.status !== "available") return { success: false, error: "현재 대여 불가능한 물품입니다." };
  if (item.user_id === user.id) return { success: false, error: "본인 물품은 빌릴 수 없습니다." };

  // 보안: 클라 계산값(depositAmount)을 그대로 신뢰하지 않고, 방금 조회한 item.price_per_day로
  // 동일 계산식(calcDeposit = 일 임대료 × 2)을 재실행해 저장값을 정한다. 인자로 받은 depositAmount는
  // 화면 표시 시점 값(경합 시 구버전일 수 있음)일 뿐 — 불일치는 조용히 서버측 계산값으로 덮어써 저장.
  // ⚠️ 이 함수는 "use server"가 아닌 브라우저 실행 코드(anon key)라 이 재계산 자체는 JS 우회(직접 REST
  // 호출) 앞에서 궁극적 신뢰 경계가 되지 못한다 — 진짜 경계는 DB RLS/트리거(별도 마이그레이션 필요).
  const verifiedDeposit = calcDeposit(item.price_per_day);
  if (depositAmount !== verifiedDeposit && process.env.NODE_ENV !== "production") {
    console.warn(
      `[requestTransaction] 클라 depositAmount(${depositAmount}) != 서버 재계산값(${verifiedDeposit}) — 서버 재계산값을 저장합니다.`
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({ item_id: itemId, lender_id: item.user_id, borrower_id: user.id,
      status: "requested" as TransactionStatus, start_date: startDate, end_date: endDate, deposit_amount: verifiedDeposit })
    .select("id").single();

  if (error || !data) return { success: false, error: "거래 요청 중 오류가 발생했습니다." };
  return { success: true, data: { transactionId: data.id } };
}

export async function acceptTransaction(transactionId: string, tossId: string): Promise<ActionResult> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data: tx, error: txError } = await supabase
    .from("transactions").select("lender_id, status").eq("id", transactionId).single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.lender_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (tx.status !== "requested") return { success: false, error: "이미 처리된 요청입니다." };

  const { error } = await supabase
    .from("transactions")
    .update({ status: "deposit_requested" as TransactionStatus, toss_id: tossId.replace(/^@/, "") })
    .eq("id", transactionId);

  if (error) return { success: false, error: "수락 처리 중 오류가 발생했습니다." };
  return { success: true, data: null };
}

export async function confirmDeposit(transactionId: string): Promise<ActionResult> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data: tx, error: txError } = await supabase
    .from("transactions").select("borrower_id, status").eq("id", transactionId).single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (tx.status !== "deposit_requested") return { success: false, error: "보증금 요청 상태가 아닙니다." };

  const { error } = await supabase
    .from("transactions").update({ status: "deposit_confirmed" as TransactionStatus }).eq("id", transactionId);

  if (error) return { success: false, error: "확인 처리 중 오류가 발생했습니다." };
  return { success: true, data: null };
}

export async function uploadTransactionPhoto(
  transactionId: string,
  photoType: "before_handover" | "after_return",
  formData: FormData
): Promise<ActionResult<{ photoId: string; publicUrl: string }>> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { success: false, error: "사진 파일이 없습니다." };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: "사진은 10MB 이하만 업로드 가능합니다." };

  const { data: tx, error: txError } = await supabase
    .from("transactions").select("lender_id, borrower_id, status").eq("id", transactionId).single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.lender_id !== user.id && tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${transactionId}/${user.id}/${photoType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("transaction-photos").upload(storagePath, file, { upsert: false });
  if (uploadError) return { success: false, error: "사진 업로드 중 오류가 발생했습니다." };

  const { data: photoData, error: insertError } = await supabase
    .from("transaction_photos")
    .insert({ transaction_id: transactionId, uploaded_by: user.id, photo_type: photoType, storage_path: storagePath })
    .select("id").single();

  if (insertError || !photoData) return { success: false, error: "사진 기록 저장 중 오류가 발생했습니다." };

  const { data: urlData } = supabase.storage.from("transaction-photos").getPublicUrl(storagePath);
  return { success: true, data: { photoId: photoData.id, publicUrl: urlData.publicUrl } };
}

export async function confirmHandover(transactionId: string, role: TransactionRole): Promise<ActionResult> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("lender_id, borrower_id, status, lender_confirmed_handover, borrower_confirmed_handover")
    .eq("id", transactionId).single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.status !== "deposit_confirmed") return { success: false, error: "보증금 확인 후 전달 확인이 가능합니다." };
  if (role === "lender" && tx.lender_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (role === "borrower" && tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };

  const updateField = role === "lender" ? "lender_confirmed_handover" : "borrower_confirmed_handover";
  const otherConfirmed = role === "lender" ? tx.borrower_confirmed_handover : tx.lender_confirmed_handover;
  const newStatus: TransactionStatus = otherConfirmed ? "handed_over" : "deposit_confirmed";

  const { error } = await supabase
    .from("transactions").update({ [updateField]: true, status: newStatus }).eq("id", transactionId);

  if (error) return { success: false, error: "전달 확인 중 오류가 발생했습니다." };
  return { success: true, data: null };
}

export async function confirmReturn(transactionId: string, role: TransactionRole): Promise<ActionResult> {
  let user;
  try { user = await getAuthUser(); } catch { return { success: false, error: "로그인이 필요합니다." }; }

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("lender_id, borrower_id, status, lender_confirmed_return, borrower_confirmed_return")
    .eq("id", transactionId).single();

  if (txError || !tx) return { success: false, error: "거래를 찾을 수 없습니다." };
  if (tx.status !== "returned" && tx.status !== "handed_over") return { success: false, error: "전달 완료 후 반납 확인이 가능합니다." };
  if (role === "lender" && tx.lender_id !== user.id) return { success: false, error: "권한이 없습니다." };
  if (role === "borrower" && tx.borrower_id !== user.id) return { success: false, error: "권한이 없습니다." };

  const updateField = role === "lender" ? "lender_confirmed_return" : "borrower_confirmed_return";
  const otherConfirmed = role === "lender" ? tx.borrower_confirmed_return : tx.lender_confirmed_return;
  const newStatus: TransactionStatus = otherConfirmed ? "completed" : "returned";

  const { error } = await supabase
    .from("transactions").update({ [updateField]: true, status: newStatus }).eq("id", transactionId);

  if (error) return { success: false, error: "반납 확인 중 오류가 발생했습니다." };
  return { success: true, data: null };
}
