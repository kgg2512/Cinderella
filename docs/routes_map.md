# 신데렐라 — 라우트/화면 맵 (G1 구조 전수 순회)

> 생성: 2026-07-24 (골모드 P1 G1) · 브랜치 `goal/20260724-cinderella`
> 방식: 코드 실측(Next.js App Router `src/app/**`). 웹·앱 **동일 코드베이스**(Capacitor 래핑) — 라우트 100% 공유.
> 인증 방식만 분기: 웹=리디렉션 OAuth / 앱=딥링크 OAuth(`src/lib/mobile-auth.ts`). 데모=`isDemoMode()` stub(Supabase 무호출).

## 라우트 인벤토리 (16 navigable + 1 helper dir)

| # | 라우트 | 파일 | 접근 | 빈/에러 상태 | 뒤로가기·리다이렉트 | 비고 |
|---|--------|------|------|-------------|--------------------|------|
| 1 | `/` | `page.tsx`→`HomeClient.tsx` | 공개(데모 열람) | ✅ 빈 상태(아이템 0) + 로딩 | 홈=루트 | **[수정]** 빈 상태 CTA `/sell`(죽은 링크)→`/items/new` |
| 2 | `/auth/callback` | `auth/callback/page.tsx` | 공개(OAuth) | ✅ error/timeout(5s)→`/login?error=` | 세션 성공 시 `safeNext`로 replace | PKCE 명시 교환, 이중소비 race 방어 |
| 3 | `/login` | `login/page.tsx` | 공개 | ✅ error/notice 배너 | next 복귀=sessionStorage | 동의 게이트(약관·개인정보 필수 체크) + Google/이메일/데모 |
| 4 | `/search` | `search/page.tsx` | 공개 | ✅ | Navbar | 아이템 검색 |
| 5 | `/items/[id]` | `ItemDetailClient.tsx` | 공개 열람 | ✅ | 액션→transactions/chats push | 대여 요청·채팅 시작 |
| 6 | `/items/my` | `items/my/page.tsx` | 🔒 인증 | ✅ 빈→`/items/new` CTA | `!user`→`loginPathWithNext()` | 내 물품 |
| 7 | `/items/new` | `items/new/page.tsx` | 🔒 인증 | ✅ | 성공→`/items/[id]` | 물품 등록 |
| 8 | `/chats` | `chats/page.tsx` | 🔒 인증 | ✅ | `!user`→login | 채팅 목록 |
| 9 | `/chats/[id]` | `ChatRoomClient.tsx` | 🔒 인증 | ✅ 로드 실패→`/chats` | `!user`→login | 채팅방 |
| 10 | `/wishlist` | `WishlistClient.tsx` | 🔒 인증 | ✅ | `!user`→login | 좋아요 |
| 11 | `/transactions` | `transactions/page.tsx` | 🔒 인증 | ✅ | `!user`→login | 거래 목록(7단계 상태) |
| 12 | `/transactions/[id]` | `TransactionDetailClient.tsx` | 🔒 인증 | ✅ 없음→`/transactions` | `!user`→login | 거래 상세·타임라인 |
| 13 | `/profile` | `profile/page.tsx` | 🔒 인증 | ✅ | `!user`→login | 메뉴: 내물품/이용내역/설정 |
| 14 | `/settings` | `settings/page.tsx` | 🔒 인증 | ✅ | 탈퇴→`/login?deleted=1` | **계정 삭제**(delete_current_user RPC) + 약관/개인정보 링크 |
| 15 | `/privacy` | `privacy/page.tsx` | 공개 | — | 정적 | 개인정보처리방침(+ 루트 `privacy.html`) |
| 16 | `/terms` | `terms/page.tsx` | 공개 | — | 정적 | 이용약관(+ 루트 `terms.html`) |
| — | `/safety` | `safety/client-actions.ts` | (라우트 아님) | — | — | 신고·차단 공유 액션 모듈(page.tsx 없음) |

## 인증 루프 점검 (프롬프트 G1 집중 항목)

| 케이스 | 코드 방어 | 판정 |
|--------|----------|------|
| 로그인 무한반복(PKCE 이중소비 race) | `detectSessionInUrl:false` + callback에서 명시 `exchangeCodeForSession` 단일 실행 | ✅ 방어됨 (2026-06-12 회귀 원인 고정) |
| redirect URL 쿼리 매칭 깨짐→Site URL 낙하 | next를 redirect URL에 안 싣고 `sessionStorage(stashNext)` 보관·회수 | ✅ 방어됨 |
| Open Redirect | `sanitizeNext`(내부경로만, `//` 차단) | ✅ |
| 세션 만료·이벤트 놓침 | callback 1단계 `getSession()` 선확인 + 3단계 `onAuthStateChange` + 5s timeout | ✅ |
| 로그아웃 후 보호 라우트 | 각 보호 페이지 `!user`→`loginPathWithNext()` 가드 | ✅ |
| 딥링크 직행(앱) | `appUrlOpen` 리스너로 code 회수→교환 | ✅ |

**결론:** 프롬프트가 우려한 인증 루프는 코드에 이미 방어 설계됨. 신규 결함 발견 0. 정적 코드 검증 기준(런타임 실기기 OAuth는 회장 Google 계정 필요 → 판단 대기).

## 웹·앱 기능 패리티

동일 코드베이스 → **라우트/화면 100% 패리티.** 유일 분기 = OAuth 전달 경로(웹 리디렉션 vs 앱 딥링크), 둘 다 구현·검증. 데모 모드는 Supabase stub으로 전 화면 열람 가능(로그인 불필요).

## G1에서 수정한 것
1. `HomeClient.tsx` 빈 상태 CTA 죽은 링크 `/sell` → `/items/new` (`<a>`→`<Link>`).
