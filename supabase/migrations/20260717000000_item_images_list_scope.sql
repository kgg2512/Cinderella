-- ============================================================================
-- F-CIN-06 (T-10/T-03): item-images public 버킷 SELECT 정책 스코프 봉합
-- ============================================================================
-- 문제: 기존 "Anyone can view item images" 정책이 `bucket_id='item-images'`만 검사
--   (폴더 무스코프, role=public) → anon이 storage list API(.list())로 전체
--   uid 집합·인벤토리 수·업로드 시각을 열거 가능(사용자 열거 유출).
--   근거: supabase security advisor `public_bucket_allows_listing`.
--
-- 무손상 근거:
--   1) 이미지 "표시"는 public 버킷의 getPublicUrl(=CDN /object/public/…)로 서빙되며
--      RLS를 우회한다 → SELECT 정책을 좁혀도 표시는 그대로.
--   2) .list()는 회원탈퇴 플로우(src/app/settings/page.tsx)의 본인 폴더
--      (items/{auth.uid()}) 1곳뿐이며 authenticated 세션 → 아래 정책으로 보존.
--   3) 다른 유저 이미지를 authenticated 객체경로(/object/…)로 읽는 코드 없음(grep 확인).
--
-- 검증(2026-07-17 라이브): 적용 후 anon POST /storage/v1/object/list/item-images → []
--   (차단), advisor `public_bucket_allows_listing` 소멸.
-- ============================================================================

drop policy if exists "Anyone can view item images" on storage.objects;

create policy "item_images_list_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'item-images'
    and (auth.uid())::text = (storage.foldername(name))[2]
  );
