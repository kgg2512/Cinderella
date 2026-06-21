-- =============================================
-- 신데렐라 UGC 신고/차단 마이그레이션
-- Google Play "User Generated Content" 정책 필수 요건:
--   사용자가 부적절 콘텐츠(아이템/유저/메시지/채팅)를 신고하고
--   특정 유저를 차단할 수 있어야 한다.
-- CISO 제약: 본인(auth.uid())만 자신의 신고/차단을 insert/select,
--            anon/public 금지, char_length 제한, 자기 자신 차단 금지.
-- 명명·주석·RLS 스타일은 20260611000000_chats.sql 패턴을 그대로 따른다.
-- =============================================

-- ── 신고 테이블 ───────────────────────────────
-- target_type 으로 신고 대상 종류를 구분(아이템/유저/메시지/채팅).
-- target_id 는 해당 대상의 UUID(아이템 id, 유저 id, 메시지 id, 채팅 id).
-- 콘텐츠 종류별 FK 를 걸지 않는 이유: 대상이 신고 후 삭제되어도
-- 신고 기록(운영 검토용)은 보존되어야 하므로 약한 참조(uuid)만 저장한다.
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('item', 'user', 'message', 'chat')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 50),
  detail      TEXT CHECK (detail IS NULL OR char_length(detail) <= 1000),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 동일 사용자가 동일 대상을 중복 신고하는 것을 방지(스팸 신고로 테이블 오염 차단)
  CONSTRAINT reports_unique_reporter_target UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);

-- ── 차단 테이블 ───────────────────────────────
-- 한 사용자가 다른 사용자를 차단. UNIQUE 로 중복 차단 방지,
-- CHECK 로 자기 자신 차단 방지.
CREATE TABLE IF NOT EXISTS public.blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS blocks_blocker_id_idx ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx ON public.blocks(blocked_id);

-- ── RLS 활성화 ────────────────────────────────
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- ── 신고 RLS 정책 (본인 신고만 — reporter_id = auth.uid() 강제) ──
-- 신고자 본인만 자기가 낸 신고를 조회 가능(운영자 검토는 service_role 별도).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = '본인 신고만 조회'
  ) THEN
    CREATE POLICY "본인 신고만 조회" ON public.reports
      FOR SELECT USING (auth.uid() = reporter_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = '본인만 신고 생성'
  ) THEN
    CREATE POLICY "본인만 신고 생성" ON public.reports
      FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

-- ── 차단 RLS 정책 (본인 차단만 — blocker_id = auth.uid() 강제) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blocks' AND policyname = '본인 차단만 조회'
  ) THEN
    CREATE POLICY "본인 차단만 조회" ON public.blocks
      FOR SELECT USING (auth.uid() = blocker_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blocks' AND policyname = '본인만 차단 생성'
  ) THEN
    CREATE POLICY "본인만 차단 생성" ON public.blocks
      FOR INSERT WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blocks' AND policyname = '본인만 차단 해제'
  ) THEN
    CREATE POLICY "본인만 차단 해제" ON public.blocks
      FOR DELETE USING (auth.uid() = blocker_id);
  END IF;
END $$;

COMMENT ON TABLE public.reports IS 'UGC 신고(아이템/유저/메시지/채팅). 본인 신고만 RLS 조회, 운영자는 service_role 검토.';
COMMENT ON TABLE public.blocks IS '유저 차단. 차단 시 차단 대상의 아이템/채팅 비노출. 본인 차단만 RLS 접근.';
