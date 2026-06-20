# 신데렐라 스토어 제출 체크리스트 (회장 수동 절차)

> Alpha가 코드/설정/자산/마이그레이션을 심사-레디로 만들었다. 아래는 **계정·돈·Mac·실제 제출**이 필요해 Alpha가 대신 할 수 없는 회장 액션이다. 정직: "심사 통과 보장"은 제출 주체가 회장이라 코드 레디까지가 Alpha 책임 한계.

## 0. 선행 (백엔드 prod) — 공통
- [ ] Supabase 프로젝트 생성 + `.env.local`/Vercel/Capacitor에 prod 키 주입
- [ ] **마이그레이션 적용**: `supabase db push` (또는 SQL 에디터에 `supabase/migrations/*` 순서대로 실행)
  - 신규: `20260621000000_delete_account.sql` (회원탈퇴 RPC) **← 반드시 적용**
- [ ] 적용 후 실제 테스트 계정으로 **회원탈퇴 동작 확인**(설정>회원탈퇴 → 로그인 불가 → 재로그인 시 신규가입). ⚠️ Alpha는 DB 없어 미검증
- [ ] Supabase Storage(증빙/프로필 이미지) 탈퇴 시 물리 삭제 정책 결정 — RPC는 DB만 처리. (Storage 삭제 Edge Function or 운영절차) — 후속

## 1. Google Play (먼저 권장 — Windows에서 가능)
- [ ] Google Play Console 계정($25 1회 결제)
- [x] 업로드 키스토어 생성 — ✅ **Alpha 완료**: `android/release.keystore` (alias=`cinderella-release`, SHA1 44:87:2E:25:…). 비번은 `android/local.properties`(git 비추적)
- [x] `android/app/build.gradle` signingConfig 연결 — ✅ **Alpha 완료** (release/minify/shrink 설정 포함)
- [x] AAB 빌드 — ✅ **Alpha 완료 (2026-06-21)**: 이 머신에서 직접 빌드·서명 검증함 (지난 보고의 "SDK 없음·미검증"은 오판 — SDK는 `C:\Android`에 이미 있었고 `ANDROID_HOME` 미설정뿐이었음)
  - 빌드: `gradlew bundleRelease` → **BUILD SUCCESSFUL 8m18s** (exit 0), build-tools 35.0.0 설치 후
  - 서명: `jarsigner -verify` → **"jar verified" (exit 0)**. self-signed/no-timestamp 경고는 업로드 키라 정상(Play App Signing이 재서명)
  - **산출물**: `android/app/build/outputs/bundle/release/app-release.aab` (3.51MB) — 바탕화면 `cinderella-app-release.aab`로도 복사
  - ⚠️ 회장 백업 필수: `release.keystore` + `local.properties` 비번을 별도 안전 보관(분실 시 Play App Signing이면 업로드 키 재설정은 가능하나 번거로움)
- [ ] Play Console 입력:
  - [ ] 앱 이름/짧은설명/전체설명 (한국어) — `play-store-assets/` 자산 사용
  - [ ] 그래픽: 아이콘512, 피처그래픽1024x500, 스크린샷(폰 2장+) — `play-store-assets/`, `public/icons/`
  - [ ] **개인정보처리방침 URL** (필수): 배포된 `/privacy.html` 라이브 URL
  - [ ] **데이터 안전(Data Safety) 폼**: 수집=이메일·프로필·사진·이용기록 / 목적=계정·서비스 / 삭제요청 가능=예(인앱) / 전송중암호화=예
  - [ ] 콘텐츠 등급 설문, 타깃 연령, 광고 포함 여부(현재 없음)
  - [ ] 앱 카테고리: 쇼핑

## 2. Apple App Store (🔴 Mac 필수 — Windows 불가)
- [ ] **Mac + Xcode** (없으면 클라우드 Mac: MacinCloud 등 — 유료)
- [ ] Apple Developer Program 가입 ($99/년)
- [ ] iOS 프로젝트 생성: Mac에서 `npm run build:mobile && npx cap add ios && npx cap sync ios`
- [ ] **Info.plist 권한 사용 설명**(거부 사유 1순위 — 반드시):
  - `NSCameraUsageDescription` = "상품 사진 촬영을 위해 카메라를 사용합니다."
  - `NSPhotoLibraryUsageDescription` = "상품/증빙 이미지를 첨부하기 위해 사진 보관함에 접근합니다."
  - `NSPhotoLibraryAddUsageDescription` (저장 시) — 해당 시
- [ ] **PrivacyInfo.xcprivacy** (Privacy Manifest, 2024+ 필수): 수집 데이터 타입 + 사용 API(UserDefaults 등) reason code 선언
- [ ] **Sign in with Apple 검토**: 현재 Google 로그인만 → Apple 가이드라인 4.8/HIG상 제3자 로그인 제공 시 Apple 로그인도 제공 권장(거부 사유 가능). 데모는 무관, 정식 제출 전 결정 필요
- [ ] App Store Connect: 앱 등록, 스크린샷(6.7"/6.5"/5.5" + iPad), 설명, 키워드, **개인정보 보호 라벨(Nutrition Label)**, 심사용 데모계정 제공
- [ ] **계정 삭제 경로 명시** (5.1.1(v)): 심사 메모에 "설정 > 회원 탈퇴"로 인앱 삭제 가능함을 기재

## 3. 공통 심사 대응 메모
- 결제: 플랫폼이 돈을 만지지 않는 **P2P 직접 송금(토스/카카오 딥링크)** → 실물 렌탈이라 IAP 불요. 심사 문의 시 "물리적 상품/서비스 대여, 결제는 당사자 간 외부 처리" 설명
- UGC(사용자 등록 물품/채팅): 신고·차단·콘텐츠 모더레이션 정책 필요 (Apple 1.2 / Google UGC) — 후속 구현 권장
- 로그인 없이 둘러보기: 데모/게스트 경로 있어 "콘텐츠 보려면 무조건 로그인" 거부 사유 회피 가능

## 4. Alpha가 이미 심사-레디로 해둔 것 (코드/설정)
- ✅ **서명된 릴리스 AAB 빌드·검증 완료** (2026-06-21) — `app-release.aab` 3.51MB, jarsigner verified
- ✅ 회원탈퇴(인앱) — RPC + 설정 UI + 탈퇴 후 안내
- ✅ Android targetSdk/compileSdk 35 (Play 2025+ 필수) + AGP/Gradle 연동
- ✅ 권한 위생: READ_EXTERNAL_STORAGE maxSdk32, 카메라 uses-feature required=false
- ✅ 개인정보처리방침: 거래기록 법령보존 + 인앱 탈퇴 경로 명시
- ✅ 보안: allowBackup=false, cleartext=false, OAuth 딥링크, CSP(웹)
- ✅ 정적 익스포트 빌드 통과(웹 16p / 모바일 19p)
