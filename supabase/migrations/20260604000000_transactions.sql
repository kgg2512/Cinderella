-- =============================================
-- 신데렐라 거래 시스템 마이그레이션
-- 플랫폼 무결제 모델: 증거 사진 + 타임스탬프 + 토스 딥링크
-- =============================================

-- ── 거래 테이블 ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                   UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  lender_id                 UUID NOT NULL REFERENCES public.users(id),
  borrower_id               UUID NOT NULL REFERENCES public.users(id),
  status                    TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN (
      'requested',
      'deposit_requested',
      'deposit_confirmed',
      'handed_over',
      'returned',
      'completed',
      'disputed'
    )),
  start_date                DATE NOT NULL,
  end_date                  DATE NOT NULL,
  deposit_amount            INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  toss_id                   TEXT,
  lender_confirmed_handover  BOOLEAN NOT NULL DEFAULT FALSE,
  borrower_confirmed_handover BOOLEAN NOT NULL DEFAULT FALSE,
  lender_confirmed_return    BOOLEAN NOT NULL DEFAULT FALSE,
  borrower_confirmed_return  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT different_users CHECK (lender_id != borrower_id)
);

CREATE INDEX IF NOT EXISTS transactions_item_id_idx ON public.transactions(item_id);
CREATE INDEX IF NOT EXISTS transactions_lender_id_idx ON public.transactions(lender_id);
CREATE INDEX IF NOT EXISTS transactions_borrower_id_idx ON public.transactions(borrower_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);

-- ── 거래 사진 테이블 ──────────────────────────
CREATE TABLE IF NOT EXISTS public.transaction_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  uploaded_by    UUID NOT NULL REFERENCES public.users(id),
  photo_type     TEXT NOT NULL CHECK (photo_type IN ('before_handover', 'after_return')),
  storage_path   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transaction_photos_transaction_id_idx ON public.transaction_photos(transaction_id);

-- ── RLS 활성화 ────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_photos ENABLE ROW LEVEL SECURITY;

-- ── 거래 RLS 정책 ────────────────────────────
CREATE POLICY "거래 당사자만 조회" ON public.transactions
  FOR SELECT USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

CREATE POLICY "인증 사용자가 거래 생성" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "거래 당사자만 수정" ON public.transactions
  FOR UPDATE USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

-- ── 거래 사진 RLS 정책 ────────────────────────
CREATE POLICY "거래 당사자만 사진 조회" ON public.transaction_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
      AND (t.lender_id = auth.uid() OR t.borrower_id = auth.uid())
    )
  );

CREATE POLICY "거래 당사자만 사진 업로드" ON public.transaction_photos
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
      AND (t.lender_id = auth.uid() OR t.borrower_id = auth.uid())
    )
  );

-- ── updated_at 자동 갱신 트리거 ─────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Storage: 거래 사진 버킷 ───────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-photos', 'transaction-photos', false)
ON CONFLICT (id) DO NOTHING;

-- [2026-07-09 드리프트 시정 — HIGH-2 BOLA 재발 방지]
-- 과거 이 자리의 정책은 auth.role()='authenticated' 단독(광역)이라 아무 로그인 유저나
-- 전 거래사진 열람·업로드 가능했다(HIGH-2). 재적용 시 광역정책이 부활하지 않도록,
-- 처음부터 라이브 하드닝 상태(2026-07-09 pg_policies 실측)와 동일한 이름·정의로 생성한다.
-- 라이브는 이미 하드닝 완료 — 이 파일은 신규 환경 재현용 SSOT. 경로 규칙: {transaction_id}/{user_id}/*
DROP POLICY IF EXISTS "거래 당사자만 사진 업로드" ON storage.objects; -- 구 광역 INSERT (존재 시 제거)
DROP POLICY IF EXISTS "인증 사용자만 사진 조회" ON storage.objects;   -- 구 광역 SELECT (존재 시 제거)
DROP POLICY IF EXISTS "storage_upload_party" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_party" ON storage.objects;

-- 업로드: 본인 폴더({transaction_id}/{본인 uid}/*)에만 가능
CREATE POLICY "storage_upload_party" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'transaction-photos'
    AND (auth.uid())::text = (storage.foldername(objects.name))[2]
  );

-- 조회: 본인 폴더 또는 해당 거래의 당사자(lender/borrower)만 (비공개 버킷 → signed URL 서빙)
CREATE POLICY "storage_select_party" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'transaction-photos'
    AND (
      (auth.uid())::text = (storage.foldername(objects.name))[2]
      OR EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE (t.id)::text = (storage.foldername(objects.name))[1]
          AND (t.lender_id = auth.uid() OR t.borrower_id = auth.uid())
      )
    )
  );
