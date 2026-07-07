"use server";

import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ── Supabase 서버 클라이언트 ──────────────────────────────────────────
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server Component에서 set 무시 */ }
        },
      },
    }
  );
}

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
  | { success: true; message: string; itemId: string }
  | { success: false; errors: Record<string, string[]> | string };

// ── 이미지 Storage 업로드 헬퍼 ────────────────────────────────────────
async function uploadImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];

  // 보안(MED-5): MIME 화이트리스트 — 파일명 확장자를 신뢰하지 않고 실제 타입 기준으로 검증/정규화
  const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  for (const file of files.slice(0, 5)) {
    if (file.size === 0) continue;
    if (file.size > 10 * 1024 * 1024) continue; // 10MB 초과 스킵
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) continue; // 허용 이미지 타입(jpeg/png/webp)만 업로드, 그 외 스킵

    const storagePath = `items/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("item-images")
      .upload(storagePath, file, { upsert: false });

    if (error) continue;

    const { data: urlData } = supabase.storage
      .from("item-images")
      .getPublicUrl(storagePath);

    urls.push(urlData.publicUrl);
  }

  return urls;
}

// ── Server Action: 아이템 등록 ────────────────────────────────────────
export async function submitItem(
  formData: FormData
): Promise<SubmitItemResult> {
  const supabase = await createSupabaseServerClient();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

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

  // 이미지 업로드
  const imageFiles = formData.getAll("images") as File[];
  const imageUrls = imageFiles.length > 0
    ? await uploadImages(supabase, user.id, imageFiles)
    : [];

  // items 테이블 insert
  const { data: inserted, error: insertError } = await supabase
    .from("items")
    .insert([{
      user_id: user.id,
      title: validated.title,
      brand: validated.brand || null,
      category: validated.category,
      price_per_day: validated.price,
      description: validated.desc || null,
      images: imageUrls,
      status: "available",
    }])
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { success: false, errors: "등록 중 오류가 발생했습니다. 다시 시도해주세요." };
  }

  return { success: true, message: "등록이 완료되었습니다 ✓", itemId: inserted.id };
}
