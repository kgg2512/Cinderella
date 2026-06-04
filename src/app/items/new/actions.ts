"use server";

import { z } from "zod";

// ── 입력 필드 Zod 스키마 ──────────────────────────────────────────────
const VALID_CATEGORIES = ["bags", "watches", "jewelry", "shoes", "clothing", "accessories"] as const;
const VALID_GRADES = ["S", "A", "B", "C"] as const;

export const NewItemSchema = z.object({
  brand: z
    .string()
    .max(100, "브랜드명은 100자 이내로 입력해주세요.")
    .optional()
    .transform((v) => v?.trim() ?? ""),
  title: z
    .string()
    .min(2, "상품명은 2자 이상 입력해주세요.")
    .max(200, "상품명은 200자 이내로 입력해주세요.")
    .transform((v) => v.trim()),
  price: z
    .number({ error: "가격은 숫자여야 합니다." })
    .int("가격은 정수로 입력해주세요.")
    .min(0, "가격은 0 이상이어야 합니다.")
    .max(10_000_000, "가격은 1,000만원 이하로 입력해주세요."),
  desc: z
    .string()
    .max(2000, "설명은 2000자 이내로 입력해주세요.")
    .optional()
    .transform((v) => v?.trim() ?? ""),
  category: z.enum(VALID_CATEGORIES, "유효하지 않은 카테고리입니다."),
  grade: z.enum(VALID_GRADES, "유효하지 않은 상태 등급입니다."),
});

export type NewItemInput = z.input<typeof NewItemSchema>;
export type NewItemParsed = z.output<typeof NewItemSchema>;

// ── 액션 반환 타입 ────────────────────────────────────────────────────
export type SubmitItemResult =
  | { success: true; message: string }
  | { success: false; errors: Record<string, string[]> | string };

// ── Server Action: 아이템 등록 ────────────────────────────────────────
export async function submitItem(
  formData: FormData
): Promise<SubmitItemResult> {
  // FormData → raw 객체 변환
  const raw = {
    brand: formData.get("brand"),
    title: formData.get("title"),
    price: Number(formData.get("price") ?? 0),
    desc: formData.get("desc"),
    category: formData.get("category"),
    grade: formData.get("grade"),
  };

  // Zod 서버사이드 검증
  const result = NewItemSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, errors: fieldErrors };
  }

  const validated = result.data;

  // TODO: Supabase insert + Storage 업로드
  // const supabase = createServerSupabaseClient();
  // await supabase.from("items").insert({ ...validated });

  // 현재는 검증 통과 확인 후 성공 반환
  void validated; // 미사용 변수 경고 방지 (Supabase 연동 전)

  return { success: true, message: "등록이 완료되었습니다 ✓" };
}
