-- =============================================
-- 신데렐라 1:1 채팅 마이그레이션
-- 차용자 ↔ 페어리(물품 주인) 거래 전 문의 채팅
-- CISO 제약: 참여자만 select/insert, sender_id = auth.uid() 강제,
--            content ≤ 2000자, auth.role() 단독 정책 금지 (참여자 검증 조인 필수)
-- =============================================

-- ── 채팅방 테이블 ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES public.users(id),
  owner_id    UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chats_unique_item_borrower UNIQUE (item_id, borrower_id),
  CONSTRAINT chats_different_users CHECK (borrower_id != owner_id)
);

CREATE INDEX IF NOT EXISTS chats_item_id_idx ON public.chats(item_id);
CREATE INDEX IF NOT EXISTS chats_borrower_id_idx ON public.chats(borrower_id);
CREATE INDEX IF NOT EXISTS chats_owner_id_idx ON public.chats(owner_id);

-- ── 메시지 테이블 ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id),
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_chat_id_created_at_idx ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);

-- ── RLS 활성화 ────────────────────────────────
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ── 채팅방 RLS 정책 (참여자 검증 — auth.role() 단독 금지) ──
CREATE POLICY "채팅 참여자만 조회" ON public.chats
  FOR SELECT USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

-- 차용자 본인만 생성 가능 + owner_id는 실제 물품 주인과 일치해야 함
CREATE POLICY "차용자만 채팅 생성" ON public.chats
  FOR INSERT WITH CHECK (
    auth.uid() = borrower_id
    AND borrower_id != owner_id
    AND EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.user_id = owner_id
    )
  );

-- ── 메시지 RLS 정책 (해당 chat 참여자만 + sender_id = auth.uid() 강제) ──
CREATE POLICY "채팅 참여자만 메시지 조회" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
      AND (c.borrower_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "채팅 참여자만 메시지 전송" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
      AND (c.borrower_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

-- 읽음 처리: 수신자(발신자가 아닌 참여자)만 read_at 갱신 가능
CREATE POLICY "수신자만 읽음 처리" ON public.messages
  FOR UPDATE USING (
    auth.uid() != sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
      AND (c.borrower_id = auth.uid() OR c.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() != sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
      AND (c.borrower_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

-- ── Realtime publication 등록 (RLS 적용된 변경분만 구독자에게 전달됨) ──
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- 이미 등록된 경우 무시 (재실행 안전)
END $$;
