-- ============================================================================
-- Cinderella 거래·메시지 정합성 하드닝 — 2026-07-14 보안감사 P0
-- 근거: 2026-07-14 격리 보안감사 F-CIN-01/02/03/04/05 (라이브 pg_policies/pg_proc/
--       storage.buckets 실측, project aykdkbjydinujcevuxls).
--
-- 배경: transactions/messages write 경로는 "use server"가 아니라 브라우저에서 anon key로
--   직접 supabase.update()/insert()를 호출한다(client-actions.ts). anon key는 공개이므로
--   앱 JS의 "서버 재검증"은 신뢰 경계가 아니며, 공격자가 REST를 직접 호출하면 우회된다.
--   유일한 진짜 신뢰 경계 = Postgres(RLS/트리거).
--
-- 실측된 라이브 결함:
--   F-CIN-02  보증금 INSERT 트리거 미적용 → deposit_amount 임의(0 포함) 삽입 통과.
--   F-CIN-01  transactions UPDATE 정책에 with_check 부재 → deposit_amount·확인 플래그·
--             lender_id를 anon REST로 임의 위조(보증금/Toss 금액 위조, 상호확인 위조).
--   F-CIN-04  INSERT 시 lender_id가 실제 물품 소유자인지 미검증 → 3자 위조 거래 도배.
--   F-CIN-05  messages UPDATE가 read_at 컬럼으로 한정되지 않음 → 상대 메시지 내용·발신자
--             위·변조(분쟁 증거 훼손).
--   F-CIN-03  item-images/transaction-photos 버킷 file_size_limit/allowed_mime_types = null
--             → 무제한·임의 MIME 업로드(스토리지 고갈, content-type 스푸핑).
--
-- 적용 시점 라이브 데이터: transactions 0 / items 0 / messages 0 → 기존 데이터 영향 없음.
-- 전부 방어적(권한 축소)·되돌릴 수 있음(DROP TRIGGER/FUNCTION, 버킷 제한 해제).
-- 정상 흐름 무손상: 부분 UPDATE(변경 컬럼만 SET)는 불변 컬럼을 건드리지 않으므로 통과.
-- ============================================================================

-- ── F-CIN-02 + F-CIN-04: INSERT 시 deposit_amount 서버확정 + lender=물품소유자 검증 ──
CREATE OR REPLACE FUNCTION public.enforce_deposit_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_price_per_day INTEGER;
  v_owner         UUID;
BEGIN
  SELECT price_per_day, user_id INTO v_price_per_day, v_owner
  FROM public.items
  WHERE id = NEW.item_id;

  IF v_price_per_day IS NULL THEN
    RAISE EXCEPTION '물품을 찾을 수 없습니다 (item_id: %)', NEW.item_id;
  END IF;

  -- lender_id는 실제 물품 소유자여야 한다 (3자 위조 거래 도배 방지, F-CIN-04)
  IF NEW.lender_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'lender_id가 물품 소유자와 일치하지 않습니다';
  END IF;

  -- 보증금은 클라 입력과 무관하게 서버가 확정 (일 임대료 × 2, F-CIN-02)
  NEW.deposit_amount := v_price_per_day * 2;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.enforce_deposit_amount() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS transactions_enforce_deposit_amount ON public.transactions;
CREATE TRIGGER transactions_enforce_deposit_amount
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_deposit_amount();

-- ── F-CIN-01: UPDATE 시 금액·식별 컬럼 불변 + 확인 플래그 역할잠금 ──
CREATE OR REPLACE FUNCTION public.enforce_transaction_update_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- 식별·금액 컬럼은 생성 후 불변 (부분 UPDATE는 이 컬럼을 SET하지 않으므로 정상 흐름 무손상)
  NEW.item_id        := OLD.item_id;
  NEW.lender_id      := OLD.lender_id;
  NEW.borrower_id    := OLD.borrower_id;
  NEW.deposit_amount := OLD.deposit_amount;
  NEW.created_at     := OLD.created_at;

  -- 확인 플래그: 각 당사자는 자신의 플래그만 변경 가능 (양자 상호확인 위조 차단).
  -- v_uid IS NULL(service_role/관리자 컨텍스트)은 신뢰 — anon key로는 NULL을 만들 수 없어 우회 아님.
  IF v_uid IS NOT NULL THEN
    IF (NEW.lender_confirmed_handover IS DISTINCT FROM OLD.lender_confirmed_handover
        OR NEW.lender_confirmed_return IS DISTINCT FROM OLD.lender_confirmed_return)
       AND v_uid IS DISTINCT FROM OLD.lender_id THEN
      RAISE EXCEPTION '대여자 확인 플래그는 대여자만 변경할 수 있습니다';
    END IF;

    IF (NEW.borrower_confirmed_handover IS DISTINCT FROM OLD.borrower_confirmed_handover
        OR NEW.borrower_confirmed_return IS DISTINCT FROM OLD.borrower_confirmed_return)
       AND v_uid IS DISTINCT FROM OLD.borrower_id THEN
      RAISE EXCEPTION '차용자 확인 플래그는 차용자만 변경할 수 있습니다';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.enforce_transaction_update_integrity() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS transactions_enforce_update_integrity ON public.transactions;
CREATE TRIGGER transactions_enforce_update_integrity
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_transaction_update_integrity();

-- ── F-CIN-05: 메시지 위·변조 차단 (내용·발신자·채팅 불변, read_at만 변경 허용) ──
CREATE OR REPLACE FUNCTION public.enforce_message_update_integrity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content    := OLD.content;
  NEW.sender_id  := OLD.sender_id;
  NEW.chat_id    := OLD.chat_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.enforce_message_update_integrity() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS messages_enforce_update_integrity ON public.messages;
CREATE TRIGGER messages_enforce_update_integrity
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_integrity();

-- ── F-CIN-03: 스토리지 버킷 서버측 크기·MIME 제한 (클라 MIME 검증 우회 차단) ──
UPDATE storage.buckets
SET file_size_limit    = 10485760,  -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id IN ('item-images', 'transaction-photos');
