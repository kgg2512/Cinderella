# 신데렐라 — 스토어 심사 체크리스트 코드 실측 (골모드 P1 G2)

> 2026-07-24 · 브랜치 `goal/20260724-cinderella` · 방식: 코드/DB/빌드 실측(§D 런타임 프로브)
> 원장 문서: [STORE_SUBMISSION.md](./STORE_SUBMISSION.md)(마스터) · 본 표는 프롬프트 ①~⑩의 **실측 판정**만.

| # | 항목 | 판정 | 코드/실측 근거 |
|---|------|------|---------------|
| ① | 개인정보처리방침 URL(앱 내+공개) | ✅ PASS | `/privacy` 라우트 + `public/privacy.html` + 로그인 동의링크 + 설정 INFO_ROWS. 공개 URL: `https://cinderella-iota.vercel.app/privacy.html` |
| ② | 계정 삭제(앱 내+웹 URL) | ✅ PASS | 앱 내: 설정→`delete_current_user()` RPC(DB 실존 확인)→`/login?deleted=1`. 웹: `public/account-deletion.html`(실존). migration `20260621_delete_account` 적용 |
| ③ | Sign in with Apple 필요 판정 | ⚠️ **Android=N/A / iOS=FAIL** | Google OAuth만 존재, Apple Sign In 없음(Apple 4.8: 소셜로그인 시 iOS 의무). iOS 플랫폼 미추가(`ios/` 없음, templates만). **Play 제출엔 무관**, iOS는 블로커(B4). → 판단 대기 |
| ④ | 결제 성격(IAP 비대상 확인) | ✅ PASS | `toss.ts`=toss.me/kakaopay **딥링크만**, 플랫폼 무자금. 실물 P2P 렌탈=물리적 재화/서비스→IAP 예외. 디지털 재화 혼재 0. 무료베타 중 결제UI `NEXT_PUBLIC_PAYMENTS_ENABLED` off |
| ⑤ | 권한 사용 근거 문자열 정합 | ✅ PASS | Android manifest: INTERNET·CAMERA·READ_MEDIA_IMAGES·READ_EXTERNAL_STORAGE(용도=상품 촬영/업로드, 정당). iOS: `ios-templates/Info.plist.additions`에 NSCamera/NSPhotoLibrary(Add)UsageDescription 완비. 미사용 권한(POST_NOTIFICATIONS) 제거됨 |
| ⑥ | 핵심 플로우 E2E 크래시 0 | 🟡 PARTIAL | 코드 경로·가드 견고(routes_map 참조), 모바일 빌드 컴파일 PASS(BUILD_EXIT=0, 23p). **라이브 런타임 E2E(실 Google 로그인)는 회장 계정 필요** → 판단 대기. 데모 모드 전화면 열람은 stub으로 가능 |
| ⑦ | Data Safety/개인정보 영양표 초안 | ✅ PASS | STORE_SUBMISSION.md §4 표 실재(수집=이메일·이름·userID·사진·채팅 / 미수집=결제·위치·기기ID). 코드 실측과 정합(결제=외부딥링크 미수집) |
| ⑧ | 심사관용 데모 계정+시나리오 | ✅ PASS(계정 실재) | `review@cinderella.app` / `Cinderella!Review2026` — Supabase에 프로비저닝(문서 §1, 이메일 로그인 경로). 시나리오=STORE_SUBMISSION.md §5·6. ⚠️비번 노출은 심사용 전용 계정(관행) |
| ⑨ | 2026 최소 타겟 SDK/API | 🟡 PASS-now/조치권고 | 현재 `targetSdk=35`(variables.gradle 실측). [확인] Google Play: **~2026-08-31까지 API35 유효, 이후 신규앱은 API36 필수**(연장 11/1). 제출이 마감 근접 → **targetSdk 36 상향 권고**(compileSdk36+빌드툴 필요=env 작업). Apple: 최신 Xcode SDK |
| ⑩ | 스토어 메타데이터·스크린샷 스펙 | 🟡 문서 완비/자산 일부 | `APPSTORE_ASSETS.md`·`PLAY_SUBMISSION_GUIDE.md`·`play-store-assets/`(icon-1024) 실재. 아이콘512/피처그래픽 경로 문서화. **실기기 스크린샷 캡처는 미완**(자산 준비 필요) → 판단 대기 |

## 종합
- **Google Play(Android) 제출 준비도**: 코드/빌드 기준 **높음**. 남은 것은 회장 액션(계정·결제·keystore·12명 테스터·스크린샷)뿐 — 코드 블로커 0.
- **Apple(iOS) 제출**: iOS 플랫폼 미추가 + Apple Sign In 없음 → 코드 작업 잔존(B4). 근시일 타겟은 Play 권고.
- **G1 수정 1건**: 홈 빈 상태 죽은 링크 `/sell`→`/items/new`.
- **DB 보안**: RLS 10테이블 전부 on + 보증금/거래 무결성 트리거 실존(런타임 확인). `docs/supabase-rls-fixes.sql`=stale(정식 마이그레이션으로 대체).

## 회장 결정/액션 대기 (P1분 — 최종 판단대기 목록에 통합)
1. targetSdk 35→36 상향(2026-08-31 마감 대비) — 빌드툴 SDK36 필요
2. 유출비번 보호(HaveIBeenPwned) 활성 — Supabase 대시보드 토글
3. iOS: 플랫폼 추가 + Apple Sign In 구현(iOS 노릴 때)
4. 라이브 E2E(실 Google 로그인) — 회장 계정
5. 스토어 개발자 계정·결제·keystore·12명 테스터·실기기 스크린샷(문서 §2,7)
