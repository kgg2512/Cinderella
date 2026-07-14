import { z } from "zod";
import { supabase } from "@/lib/supabase";

const VALID_CATEGORIES = ["bags", "watches", "jewelry", "shoes", "clothing", "accessories"] as const;
const VALID_GRADES = ["S", "A", "B", "C"] as const;

export const NewItemSchema = z.object({
  brand: z.string().max(100).optional().transform((v) => v?.trim() ?? ""),
  title: z.string().min(2).max(200).transform((v) => v.trim()),
  price: z.number().int().min(0).max(10_000_000),
  desc: z.string().max(2000).optional().transform((v) => v?.trim() ?? ""),
  category: z.enum(VALID_CATEGORIES),
  grade: z.enum(VALID_GRADES),
});

export type NewItemInput = z.input<typeof NewItemSchema>;
export type NewItemParsed = z.output<typeof NewItemSchema>;

export type SubmitItemResult =
  | { success: true; message: string; itemId: string }
  | { success: false; errors: Record<string, string[]> | string };

export async function submitItem(formData: FormData): Promise<SubmitItemResult> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, errors: "로그인이 필요합니다." };

  const raw = {
    brand: formData.get("brand"),
    title: formData.get("title"),
    price: Number(formData.get("price") ?? 0),
    desc: formData.get("desc"),
    category: formData.get("category"),
    grade: formData.get("grade"),
  };

  const result = NewItemSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const validated = result.data;
  const imageFiles = formData.getAll("images") as File[];
  const imageUrls: string[] = [];

  // 보안(F-GAP-01): item-images는 public 버킷 — 원본 File을 그대로 올리면 촬영 위치(EXIF GPS)가
  // public URL로 노출된다. 업로드 전 canvas 재인코딩으로 메타데이터를 자연 소멸시키고,
  // 최대변 1600px 리사이즈를 겸한다(대역폭+EXIF 동시 해결).
  // canvas가 못 읽는 포맷(HEIC 등)은 null 반환 → 호출부에서 원본 폴백(기능 파손 금지).
  const MAX_EDGE = 1600;
  async function reencodeWithoutExif(
    file: File
  ): Promise<{ blob: Blob; type: string; ext: string } | null> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      // png는 투명도 보존 위해 유지, 그 외(jpeg/webp)는 jpeg 0.9로 재인코딩
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, type === "image/jpeg" ? 0.9 : undefined)
      );
      if (!blob) return null;
      return { blob, type, ext: type === "image/png" ? "png" : "jpg" };
    } catch {
      return null; // 디코딩/캔버스 실패 → 원본 폴백
    }
  }

  // 보안(MED-5): MIME 화이트리스트 — 파일명 확장자를 신뢰하지 않고 실제 타입 기준으로 검증/정규화
  // (src/app/items/new/actions.ts의 uploadImages와 동일 정책 — 실사용 경로는 이쪽이므로 여기에도 적용)
  const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  for (const file of imageFiles.slice(0, 5)) {
    if (file.size === 0 || file.size > 10 * 1024 * 1024) continue;
    if (!ALLOWED_TYPES[file.type]) continue; // 허용 이미지 타입(jpeg/png/webp)만 업로드, 그 외(svg/html 등) 스킵
    // 보안(F-GAP-01): 업로드 전 재인코딩으로 EXIF(GPS) 제거. 실패 시 원본 폴백.
    const clean = await reencodeWithoutExif(file);
    const body: Blob = clean?.blob ?? file;
    const contentType = clean?.type ?? file.type;
    const ext = clean?.ext ?? ALLOWED_TYPES[file.type];
    const storagePath = `items/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("item-images").upload(storagePath, body, {
      upsert: false,
      contentType,
    });
    if (error) continue;
    const { data: urlData } = supabase.storage.from("item-images").getPublicUrl(storagePath);
    imageUrls.push(urlData.publicUrl);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertError } = await (supabase.from("items") as any)
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
    .select("id").single();

  if (insertError || !inserted) return { success: false, errors: "등록 중 오류가 발생했습니다." };
  return { success: true, message: "등록이 완료되었습니다 ✓", itemId: inserted.id };
}
