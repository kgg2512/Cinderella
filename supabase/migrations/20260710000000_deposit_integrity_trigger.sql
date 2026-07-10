-- ============================================================================
-- Cinderella 보안 하드닝 — 보증금(deposit_amount) DB 레벨 무결성 강제
-- 근거: G2 CTO 보안검증 2026-07-10, 회장 지시("전반적 보안검사+보완") + 신데렐라 감사 🟡항목
--
-- 배경: requestTransaction 계열 write 경로(src/app/transactions/client-actions.ts)는
-- "use server" 없이 브라우저에서 anon key로 직접 supabase.insert()를 호출한다(Next.js 서버
-- 액션이 아님 — 실제 라이브 UI가 쓰는 함수가 이 파일이며, 동명의 "use server" 버전
-- src/app/transactions/actions.ts는 어디서도 import되지 않는 죽은 코드로 확인됨, 2026-07-10).
-- 즉 앱 코드의 "서버 재검증"은 전부 브라우저에서 실행되는 JS이고, 공격자가 앱 JS를 우회해
-- REST API를 직접 호출하면(anon key는 공개) deposit_amount에 임의 값을 실어 보낼 수 있다.
-- 이 상황에서 유일하게 진짜인 신뢰 경계는 Postgres(RLS/트리거)뿐이다.
--
-- 기존 RLS INSERT 정책("인증 사용자가 거래 생성", 20260604000000_transactions.sql)은
-- auth.uid() = borrower_id 만 검사하고 deposit_amount 값은 전혀 검증하지 않았다(CHECK
-- deposit_amount >= 0 만 존재 — 0 이상이면 무엇이든 통과).
--
-- 수정: BEFORE INSERT 트리거로 items.price_per_day를 조회해 deposit_amount를
-- (일 임대료 × 2)로 서버가 직접 덮어쓴다 — 클라가 보낸 값은 완전히 무시된다.
-- 이는 앱 코드(src/lib/toss.ts calcDeposit)와 동일한 계산식이며, 이 트리거가 적용되면
-- 앱 코드의 재계산은 방어 심층화(defense-in-depth)로 격하되고 실제 신뢰 경계는 여기가 된다.
--
-- ⚠️ 이 파일은 레포에 추가만 되었고 라이브 프로덕션 DB에는 아직 적용되지 않았다
-- (2026-07-10 세션 — master 커밋+push만 승인 범위, 스키마 변경은 별도 승인 필요).
-- 적용 시 `supabase db push` 또는 mcp__supabase__apply_migration 사용 전:
--   1) 기존 거래 데이터 중 deposit_amount != price_per_day*2 인 행이 있는지 먼저 확인
--      (SELECT t.id, t.deposit_amount, i.price_per_day*2 AS expected FROM transactions t
--       JOIN items i ON i.id = t.item_id WHERE t.deposit_amount != i.price_per_day*2;)
--   2) 위 결과가 있으면 이 트리거는 INSERT 시점에만 작동하므로 기존 행엔 영향 없음(안전).
--   3) CTO+CSO 확인 후 적용.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_deposit_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_price_per_day INTEGER;
BEGIN
  SELECT price_per_day INTO v_price_per_day
  FROM public.items
  WHERE id = NEW.item_id;

  IF v_price_per_day IS NULL THEN
    RAISE EXCEPTION '물품을 찾을 수 없습니다 (item_id: %)', NEW.item_id;
  END IF;

  -- 클라가 보낸 deposit_amount와 무관하게 서버가 직접 계산한 값으로 확정 (일 임대료 × 2)
  NEW.deposit_amount := v_price_per_day * 2;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.enforce_deposit_amount() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS transactions_enforce_deposit_amount ON public.transactions;
CREATE TRIGGER transactions_enforce_deposit_amount
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_deposit_amount();
