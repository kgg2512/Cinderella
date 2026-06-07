-- ============================================================
-- Cinderella — Supabase RLS 설정 스크립트
-- 실행: Supabase Dashboard → SQL Editor → 전체 붙여넣기 → Run
-- ============================================================

-- ─── 1. RLS 활성화 ───────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_photos ENABLE ROW LEVEL SECURITY;

-- ─── 2. 기존 정책 정리 (재실행 안전) ────────────────────────
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

DROP POLICY IF EXISTS "items_select_all" ON items;
DROP POLICY IF EXISTS "items_insert_own" ON items;
DROP POLICY IF EXISTS "items_update_own" ON items;
DROP POLICY IF EXISTS "items_delete_own" ON items;

DROP POLICY IF EXISTS "rental_requests_select_party" ON rental_requests;
DROP POLICY IF EXISTS "rental_requests_insert_requester" ON rental_requests;
DROP POLICY IF EXISTS "rental_requests_update_owner" ON rental_requests;

DROP POLICY IF EXISTS "wishlist_select_own" ON wishlist;
DROP POLICY IF EXISTS "wishlist_insert_own" ON wishlist;
DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlist;

DROP POLICY IF EXISTS "transactions_select_party" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_borrower" ON transactions;
DROP POLICY IF EXISTS "transactions_update_party" ON transactions;

DROP POLICY IF EXISTS "transaction_photos_select_party" ON transaction_photos;
DROP POLICY IF EXISTS "transaction_photos_insert_party" ON transaction_photos;

-- ─── 3. users 테이블 ─────────────────────────────────────────
-- 본인 프로필만 읽기/수정. 타인 프로필은 items/transactions join으로만 노출.
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── 4. items 테이블 ─────────────────────────────────────────
-- 읽기: 전체 공개 (마켓플레이스)
-- 쓰기: 본인 물품만
CREATE POLICY "items_select_all" ON items
  FOR SELECT USING (true);

CREATE POLICY "items_insert_own" ON items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_update_own" ON items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "items_delete_own" ON items
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 5. rental_requests 테이블 ──────────────────────────────
-- 요청자 또는 물품 소유자만 열람
-- 요청: 본인만 생성 가능
-- 수락/거절: 물품 소유자(owner_id)만
CREATE POLICY "rental_requests_select_party" ON rental_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = owner_id
  );

CREATE POLICY "rental_requests_insert_requester" ON rental_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "rental_requests_update_owner" ON rental_requests
  FOR UPDATE USING (auth.uid() = owner_id);

-- ─── 6. wishlist 테이블 ──────────────────────────────────────
CREATE POLICY "wishlist_select_own" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wishlist_insert_own" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_delete_own" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 7. transactions 테이블 ──────────────────────────────────
-- 대여자(lender) 또는 차용자(borrower)만 조회·수정
CREATE POLICY "transactions_select_party" ON transactions
  FOR SELECT USING (
    auth.uid() = lender_id OR auth.uid() = borrower_id
  );

CREATE POLICY "transactions_insert_borrower" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "transactions_update_party" ON transactions
  FOR UPDATE USING (
    auth.uid() = lender_id OR auth.uid() = borrower_id
  );

-- ─── 8. transaction_photos 테이블 ────────────────────────────
-- 거래 당사자만 사진 조회·업로드
CREATE POLICY "transaction_photos_select_party" ON transaction_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id
        AND (t.lender_id = auth.uid() OR t.borrower_id = auth.uid())
    )
  );

CREATE POLICY "transaction_photos_insert_party" ON transaction_photos
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id
        AND (t.lender_id = auth.uid() OR t.borrower_id = auth.uid())
    )
  );

-- ─── 9. Storage: transaction-photos 버킷 정책 ────────────────
-- 버킷이 없으면 먼저 생성 (Dashboard에서 해도 됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-photos', 'transaction-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 거래 당사자만 업로드
CREATE POLICY "storage_upload_party" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'transaction-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- 거래 당사자만 조회
CREATE POLICY "storage_select_party" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'transaction-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.id::text = (storage.foldername(name))[1]
          AND (t.lender_id = auth.uid() OR t.borrower_id = auth.uid())
      )
    )
  );

-- ─── 완료 확인 ───────────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
