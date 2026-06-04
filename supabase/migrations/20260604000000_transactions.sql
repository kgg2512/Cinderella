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

-- 거래 당사자만 자신의 폴더 업로드 가능 (경로: {transaction_id}/{user_id}/*)
CREATE POLICY "거래 당사자만 사진 업로드" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'transaction-photos'
    AND auth.role() = 'authenticated'
  );

-- 거래 당사자만 조회 가능 (비공개 버킷 → signed URL 사용)
CREATE POLICY "인증 사용자만 사진 조회" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'transaction-photos'
    AND auth.role() = 'authenticated'
  );
