-- ============================================================================
-- 회원 탈퇴 (계정 삭제) — Apple App Store / Google Play 필수 요건 + GDPR/개인정보보호법
-- ============================================================================
-- 설계 근거:
--   * transactions/chats/messages 의 user FK 는 NO ACTION(상대방 기록 보존 목적).
--     따라서 auth.users 를 단순 DELETE 하면 FK 위반으로 실패하고,
--     강제 CASCADE 로 바꾸면 "거래 상대방의 거래기록"까지 삭제되어
--     전자상거래법(거래기록 5년 보존의무) 위반이 된다.
--   * 그래서 "익명화 + 로그인 자격 무효화" 방식을 채택한다:
--       - 개인 데이터(찜, 미거래 물품) 삭제
--       - 프로필/메시지/인증정보의 PII 익명화
--       - 로그인 차단(banned_until + 자격 제거) → 재로그인 불가
--       - 거래/채팅 레코드는 상대방을 위해 보존(개인식별정보는 제거됨)
--   * 개인정보처리방침에 "거래기록은 법령상 보존" 고지 필요(회장 확인).
--   * Storage 의 업로드 이미지(증빙/프로필) 물리 삭제는 SQL 범위 밖 →
--     Edge Function 또는 회장 운영 절차로 별도 처리(체크리스트 참조).
-- ============================================================================

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- 1) 개인 선호 데이터 삭제 (찜)
  delete from public.wishlist where user_id = uid;

  -- 2) 내가 보낸 메시지 내용 익명화 (대화 맥락은 상대방 위해 행 보존, 내용 PII만 제거)
  update public.messages
     set content = '(탈퇴한 회원이 삭제한 메시지)'
   where sender_id = uid;

  -- 3) 내 물품: 진행 중 거래에 묶이지 않은 것은 삭제, 거래에 묶인 것은 숨김('hidden')
  --    ('withdrawn'은 item_status enum에 없음 — 'hidden'이 유효값이며 목록 비노출 효과 동일)
  delete from public.items i
   where i.user_id = uid
     and not exists (select 1 from public.transactions t where t.item_id = i.id);
  update public.items
     set status = 'hidden'
   where user_id = uid;

  -- 4) 프로필 PII 전부 익명화: email/name/avatar (거래/채팅 상대방 기록 무결성은 보존)
  --    public.users.email 은 NOT NULL UNIQUE → uid 포함 주소로 유니크 유지
  update public.users
     set name = '탈퇴한 회원',
         avatar_url = null,
         email = 'deleted+' || uid::text || '@cinderella.invalid'
   where id = uid;

  -- 5) 로그인 자격 무효화 — 재로그인/계정복구 불가 (auth.users 완전삭제는
  --    public.users CASCADE 로 거래기록 FK 가 깨지므로 자격만 무효화한다)
  update auth.users
     set email = 'deleted+' || uid::text || '@cinderella.invalid',
         phone = null,
         encrypted_password = null,
         email_confirmed_at = null,
         phone_confirmed_at = null,
         raw_user_meta_data = '{}'::jsonb,
         banned_until = 'infinity'::timestamptz
   where id = uid;

  -- 6) OAuth 신원 연결 제거 (동일 Google 계정으로 재가입 시 새 사용자로 시작)
  delete from auth.identities where user_id = uid;
end;
$$;

-- 권한: 로그인 사용자만 본인 계정 삭제 가능 (anon/public 금지)
revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;

comment on function public.delete_current_user() is
  '로그인 사용자가 본인 계정을 탈퇴. 개인데이터 삭제 + PII 익명화 + 로그인 차단. 거래기록은 법령 보존.';
