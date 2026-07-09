# 신데렐라 — 앱스토어 / 플레이스토어 심사 제출 마스터 가이드

> 최종 갱신: 2026-07-09 · 이 문서 = 스토어 제출의 단일 진실 원천.
> 세부 자산/모더레이션은 `PLAY_SUBMISSION_GUIDE.md`, `APPSTORE_ASSETS.md`, `STORE_SUBMISSION_PACKAGE.md` 병행.

## 0. 앱 기본 정보
| 항목 | 값 |
|------|-----|
| 앱 이름 | 신데렐라 (Cinderella) |
| 번들/패키지 ID | `com.g2company.cinderella` |
| 버전 | 1.0.0 |
| 운영사 | G2 Company Ltd |
| 라이브(웹) | https://cinderella-iota.vercel.app |
| 개인정보처리방침 | https://cinderella-iota.vercel.app/privacy.html |
| 이용약관 | https://cinderella-iota.vercel.app/terms.html |
| 계정·데이터 삭제 안내 | https://cinderella-iota.vercel.app/account-deletion.html |
| 지원 이메일(전 채널 통일) | kgg2512@gmail.com |
| 카테고리 | 쇼핑 / 라이프스타일 |
| 포지셔닝 | 무료 커뮤니티 베타 · P2P 명품 렌탈 (플랫폼 무결제) |

---

## 1. 심사용 로그인 (리뷰어 제출 정보) — ⭐ 반드시 심사 노트에 기재

앱은 로그인 게이트가 있으므로 Apple 2.1 / Google 정책상 **작동하는 심사 계정**이 필요하다.
아래 **이메일+비밀번호** 계정을 App Store Connect "App Review Information"과
Play Console "앱 액세스(App access)" 에 그대로 입력한다.

```
로그인 방법: 로그인 화면 → "이메일로 로그인" → 아래 자격 입력
이메일:    review@cinderella.app
비밀번호:  Cinderella!Review2026
```

- 이 계정은 Supabase(`aykdkbjydinujcevuxls`)에 실제 프로비저닝됨 — 이메일 확인 완료, 즉시 로그인 가능.
- 웹·iOS·Android 빌드 모두 동일 자격으로 동작(Supabase `signInWithPassword`, OAuth 딥링크 불필요 → 심사원 기기에서 가장 안정적).
- Google 로그인은 심사 환경에서 자주 실패하므로(데이터센터 IP 차단) **이메일 로그인을 심사 경로로 안내**.
- [확인] 이 세션에서 auth REST `grant_type=password` 호출로 `access_token` 발급 성공 검증함.

> 비밀번호 변경 필요 시: Supabase SQL `update auth.users set encrypted_password = crypt('<new>', gen_salt('bf')) where email='review@cinderella.app';` 후 본 문서 갱신.

---

## 2. 심사 비용 & 회장 액션 (돈/계정 = 회장 전용)

| 항목 | 비용 | 근거(현행) |
|------|------|-----------|
| Apple Developer Program | **US$99 / 년** | developer.apple.com/support/compare-memberships |
| Google Play Console 등록 | **US$25 / 1회** | support.google.com/googleplay/android-developer/answer/6112435 |

**회장이 직접 해야 하는 것 (Alpha/CTO 불가):**
1. [ ] Apple Developer Program 가입/결제(연 $99) — Apple ID + 유료 멤버십.
2. [ ] Google Play Console 계정 생성/결제($25 1회) + 신원확인(D-U-N-S 불요, 개인).
3. [ ] App Store Connect·Play Console에서 앱 레코드 생성 후 위 심사 계정·심사 노트 입력.
4. [ ] 서명: iOS = 로컬 Xcode/Transporter 최종 서명·업로드 / Android = 업로드 키(keystore) 생성·서명(App Bundle).
5. [ ] (iOS CI 사용 시) GitHub 리포 Secrets에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록.

### ⚠️ Google Play 신규 개인 계정 테스트 요건 (병목 — 반드시 사전 인지)
[확인] 2023-11 이후 **신규 개인(personal) 개발자 계정**은 프로덕션 출시 전
**최소 12명의 테스터가 참여한 비공개(closed) 테스트를 14일 연속** 운영해야 프로덕션 액세스를 신청할 수 있다.
- 근거: support.google.com/googleplay/android-developer/answer/14151465
- "At least 12 testers must be opted-in ... for the last 14 days."
- 함의: **플레이스토어는 신청 즉시 출시 불가 → 최소 2주 리드타임.** 테스터 12명(지인/베타 페어리) 확보를 먼저 준비.
- 회피: 조직(회사)이 아닌 개인 계정 기준. 조직 계정은 요건이 다를 수 있으나 신원확인 강도↑.
- Apple에는 이 테스터 요건 없음(내부 심사만).

---

## 3. 제출 준비 상태 (이번 작업 2026-07-09 완료분)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 1 | 약관·개인정보 명시 동의 체크박스(로그인 게이트) | ✅ 완료 | 미체크 시 로그인/데모 진입 비활성 |
| 2 | 지원 이메일 kgg2512@gmail.com 전 채널 통일 + 설정 문의하기 활성(mailto) | ✅ 완료 | grep 잔여 불일치 0 |
| 3 | 1024×1024 앱 아이콘(불투명·알파 없음) | ✅ 완료 | `play-store-assets/icon-1024.png`, `ios-templates/AppIcon-1024.png` |
| 4 | 미작동 푸시 플러그인 제거 | ✅ 완료 | `@capacitor/push-notifications` 제거 · POST_NOTIFICATIONS 미선언 |
| 5 | Toss 결제 UI 무료 베타 동안 비노출(플래그) | ✅ 완료 | `NEXT_PUBLIC_PAYMENTS_ENABLED` 기본 off, 거래흐름 유지 |
| 6 | 심사용 이메일 로그인 UI + 리뷰 계정 | ✅ 완료 | §1 자격 |
| 7 | 인앱 계정삭제 / 신고 / 차단 | ✅ 기존 충족 | settings·ReportSheet·blocks |
| 8 | 개인정보처리방침·이용약관 페이지 | ✅ 기존 충족 | /privacy /terms |
| 9 | iOS Privacy Manifest / Info.plist 권한문구 | ✅ 템플릿 완비 | `ios-templates/` |
| 10 | iOS unsigned 빌드 CI(수동 전용) | ✅ 작성 | `.github/workflows/ios-build.yml` (workflow_dispatch) |

빌드 검증(2026-07-09): `npm run build`(웹 16p) / `npm run build:mobile`(19p→out/) / `npx cap sync android`(플러그인 5개, push 없음) 전부 성공.

---

## 4. 데이터 세이프티 / 개인정보 라벨 매핑 (제출 폼 입력값)

앱이 **실제로 수집·전송하는 데이터만** 선언한다(라벨 불일치 = 거절 사유).

| 데이터 | 수집 | 신원연결 | 광고추적 | 목적 | Apple 라벨 | Google Play 카테고리 |
|--------|:----:|:-------:|:-------:|------|-----------|--------------------|
| 이메일 주소 | O | O | X | 계정/로그인 | Contact Info → Email Address | 개인정보 → 이메일 주소 |
| 이름(표시명) | O | O | X | 프로필 | Contact Info → Name | 개인정보 → 이름 |
| 사용자 ID | O | O | X | 계정 식별 | Identifiers → User ID | 앱 활동/기기 → 없음(계정ID) |
| 사진(상품 이미지) | O | O | X | 물품 등록 | User Content → Photos/Videos | 사진 및 동영상 → 사진 |
| 채팅 메시지 | O | O | X | 거래 소통 | User Content → Other User Content | 메시지 → 인앱 메시지 |
| 결제 정보 | **X** | - | - | (P2P 외부 딥링크, 앱 미수집) | 선언 안 함 | 선언 안 함 |
| 위치 | X | - | - | - | 없음 | 없음 |
| 기기 ID | **X** | - | - | (푸시 미구현·제거) | 없음 | 없음 |

공통 선언:
- 전송 중 암호화: 예(HTTPS/TLS, Supabase).
- 사용자 데이터 삭제 요청 가능: 예 → 인앱 회원탈퇴 + https://cinderella-iota.vercel.app/account-deletion.html
- 광고·제3자 추적: 없음. `NSPrivacyTracking=false`.

---

## 5. Apple App Store 제출 절차 (요약)
1. App Store Connect → 앱 생성(번들 `com.g2company.cinderella`).
2. **App Privacy** → §4 표대로 입력(추적 없음).
3. **App Review Information** → §1 이메일 심사 계정 + 노트: "이메일로 로그인 사용. Google 로그인은 심사환경 제약으로 미권장."
4. 빌드 업로드: 로컬 Xcode에서 `npx cap add ios` → 서명 → Archive → Transporter/Organizer 업로드.
   - Info.plist에 카메라/사진 권한 문구 병합(`ios-templates/Info.plist.additions`), `PrivacyInfo.xcprivacy` 포함.
   - (CI로 unsigned 산출물만 만들려면 `ios-build.yml` 수동 실행.)
5. 스크린샷(6.7"/6.5" 등) — `APPSTORE_ASSETS.md` 참조.
6. 심사 제출.

### Apple 단골 리젝 대응
| 리젝 사유 | 대응 |
|----------|------|
| 2.1 로그인 못함 | §1 이메일 심사 계정 제공(완료) |
| 5.1.1 계정삭제 없음 | 인앱 회원탈퇴(설정) + 삭제 안내 URL(완료) |
| 3.1.1 결제(IAP) | P2P 실물 렌탈 = IAP 예외. 무료 베타 동안 결제 UI 비노출(완료). 문의 시 "person-to-person 실물 대여" 설명 |
| 4.0 미완성/플레이스홀더 | 데모 데이터로 전 화면 기능 시연 가능 · 실계정으로 실기능 |
| 5.1.1(v) UGC 안전장치 | 신고·차단·모더레이션 존재(완료) |
| 1.2 UGC 없는 신고수단 | ReportSheet 4종 + 차단(완료) |

---

## 6. Google Play 제출 절차 (요약)
1. Play Console → 앱 생성 → **비공개 테스트(Closed testing) 트랙 먼저 생성**.
2. **§2 12명/14일 테스트 먼저 시작** (프로덕션 신청 전 필수 — 리드타임 2주+).
3. App Bundle(.aab) 업로드: `npm run build:mobile` → `npx cap sync android` → Android Studio에서 서명된 AAB 생성.
4. **데이터 세이프티** 폼 → §4 표대로 입력.
5. 앱 콘텐츠: 개인정보처리방침 URL, 계정삭제 URL(위), 대상 연령, 광고 없음, 콘텐츠 등급 설문.
6. **앱 액세스**: §1 이메일 심사 계정 입력(로그인 필요 앱).
7. 스토어 등록정보: 아이콘 512(`public/icons/icon-512.png`), 피처그래픽(`feature-graphic-1024x500.png`), 스크린샷.
8. 14일 테스트 충족 후 프로덕션 신청.

### Play 단골 리젝/거부 대응
| 사유 | 대응 |
|------|------|
| 미작동 권한 요청 | POST_NOTIFICATIONS 등 미사용 권한 제거(완료) |
| 데이터 세이프티 불일치 | 실제 수집 항목만 선언(§4, 완료) |
| 계정삭제 경로 없음 | 인앱 + 웹 URL(완료) |
| UGC 정책 | 신고/차단/모더레이션(완료) |
| 개인/금전 거래 명시 | "대여 결제는 당사자 간 외부 송금 · 실물 명품 물리 대여" 명시 |

---

## 7. 미해결 / 회장 결정 대기
- [ ] Apple/Google 유료 계정 개설·결제(§2) — **회장 전용**.
- [ ] Play 12명 테스터 확보(2주 리드타임) — 베타 페어리/지인.
- [ ] Android 업로드 keystore 생성·보관 — **회장**(분실 시 앱 갱신 불가, 안전보관 필수).
- [ ] 스토어 스크린샷 실제 캡처(기기/시뮬레이터) — 자산 준비.
- [ ] iOS 실빌드 서명(로컬 macOS 필요) — 회장 환경 또는 macOS 러너+서명 인증서.
