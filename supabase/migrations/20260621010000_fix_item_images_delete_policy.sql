-- ============================================================================
-- item-images Storage DELETE 정책 교정 (회원탈퇴 시 물품 사진 물리삭제 가능하게)
-- ============================================================================
-- 업로드 경로 규칙: items/{user_id}/{filename}  (src/app/items/new/*-actions.ts)
--   → storage.foldername(name) = {items, {user_id}}  (PostgreSQL 1-based 배열)
--   → 기존 정책은 [1](='items')을 auth.uid()와 비교 → 항상 false → 본인조차 삭제 불가(버그).
-- 교정: [2](=실제 user_id)와 비교. 회원탈퇴 플로우(settings)의 클라이언트 remove가 작동하도록.
--
-- transaction-photos(거래 증빙)는 전자상거래법 보존의무 → DELETE 정책을 의도적으로 두지 않는다.
-- ============================================================================

drop policy if exists "Users can delete own item images" on storage.objects;

create policy "Users can delete own item images" on storage.objects
  for delete to public
  using (
    bucket_id = 'item-images'
    and (auth.uid())::text = (storage.foldername(name))[2]
  );
