-- ============================================================================
-- Cinderella 보안 하드닝 — G2 보안·개인정보 감사 2026-07-07 (P0/P1)
-- 근거: (G2)docs/reports/security/2026-07-07_cinderella_audit.md + 라이브 pg_policies/advisor 실측
-- 라이브 적용 완료(project aykdkbjydinujcevuxls, 2026-07-07). 전부 되돌릴 수 있는 변경.
-- 검증: anon email SELECT → 42501 denied / anon name·avatar SELECT 정상 / advisor 8건→3건.
-- ============================================================================

-- [HIGH-1] users.email 컬럼 노출 차단 (공개 anon 키 email harvesting 방지)
--   SELECT 정책 USING(true)는 유지(이름·아바타 = 공개 프로필로 앱이 필요),
--   email 컬럼만 anon/authenticated 열람권 회수. 본인 email은 auth JWT에서 취득하므로 무영향.
--   (동반 코드수정: src/app/items/[id]/ItemDetailPageClient.tsx 의 email 조인 제거)
REVOKE SELECT ON public.users FROM anon, authenticated;
GRANT  SELECT (id, name, avatar_url, created_at) ON public.users TO anon, authenticated;

-- [HIGH-2] transaction-photos 구 광역정책 제거 (당사자 스코프 정책은 이미 존재)
--   허용정책 OR 결합 탓에 구 광역정책이 살아있으면 전면 개방 유지됨 → 구 정책만 제거.
--   [2026-07-09 드리프트 시정] 기반 20260604000000_transactions.sql이 처음부터 스코프 정책
--   (storage_upload_party/storage_select_party)만 생성하도록 수정됨 → 신규 재적용 시 아래는 안전한 no-op.
--   과거 광역정책의 모든 세대 이름(라이브 구명 "TxStorage *" + repo 구명 한글 2건)을 방어적으로 제거.
DROP POLICY IF EXISTS "TxStorage select" ON storage.objects;
DROP POLICY IF EXISTS "TxStorage insert" ON storage.objects;
DROP POLICY IF EXISTS "인증 사용자만 사진 조회" ON storage.objects;
DROP POLICY IF EXISTS "거래 당사자만 사진 업로드" ON storage.objects;

-- [MED-5] item-images 업로드를 본인 폴더로 스코프 (경로 items/{uid}/* 확인됨)
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
CREATE POLICY "본인 폴더에만 물품이미지 업로드" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'item-images'
    AND (auth.uid())::text = (storage.foldername(name))[2]
  );

-- [MED-3] SECURITY DEFINER 트리거 함수 search_path 고정 (advisor: function_search_path_mutable)
ALTER FUNCTION public.handle_new_user()   SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';

-- [advisor] 트리거 전용 함수는 REST RPC로 호출될 이유 없음 → anon/authenticated EXECUTE 회수
REVOKE EXECUTE ON FUNCTION public.handle_new_user()   FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
