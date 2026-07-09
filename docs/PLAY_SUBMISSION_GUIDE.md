# 신데렐라 — Google Play 제출 가이드 (회장 클릭 단위)

> 작성: Alpha · 2026-06-21 · 코드/자산은 심사-레디. 아래는 **계정·결제·실제 제출**이 필요해 Alpha가 대신 못 하는 회장 액션 + 그대로 복붙할 정답.

## ✅ Alpha가 끝낸 것 (심사-레디)
- 서명된 릴리스 AAB: `android/app/build/outputs/bundle/release/app-release.aab` (UGC 신고/차단 반영본은 Phase 3 완료 후 재빌드 — 본 가이드 0번 참조)
- targetSdk/compileSdk 35, minSdk 22 (Play 2025+ 요건 충족)
- 권한 최소화(INTERNET·CAMERA·READ_MEDIA_IMAGES, READ_EXTERNAL maxSdk32), camera required=false
- allowBackup=false, cleartext 차단, OAuth 딥링크
- 개인정보처리방침 라이브: https://cinderella-iota.vercel.app/privacy.html
- 계정삭제 안내 페이지 라이브(예정): https://cinderella-iota.vercel.app/account-deletion.html
- 리스팅 자산: 아이콘512, 피처그래픽1024x500, 스크린샷 (`play-store-assets/`, `public/icons/`)

---

## 0. 선행 (회장 — 코드 외 인프라)
1. **Supabase 마이그레이션 적용** (Supabase 대시보드 → SQL Editor에 순서대로 붙여넣기, 또는 `supabase db push`):
   - `supabase/migrations/20260604000000_transactions.sql` *(이미 적용된 것으로 보임 — items/transactions/chats 테이블 200 응답)*
   - `supabase/migrations/20260611000000_chats.sql` *(적용된 것으로 보임)*
   - `supabase/migrations/20260621000000_delete_account.sql` **← 회원탈퇴 RPC, 미적용 시 탈퇴 버튼 실패**
   - `supabase/migrations/20260621100000_reports_blocks.sql` **← 신고/차단(Phase 3 신규), 미적용 시 신고/차단 실패**
   - 적용 후: 실제 테스트 계정으로 ①회원탈퇴 ②신고 ③차단 동작 1회씩 확인
2. **테스트용 Google 계정 1개** 준비 (Play 심사관이 로그인해볼 계정 — 3번 App access에서 사용)

## 1. Play Console 계정
- https://play.google.com/console → 개발자 등록 **$25 1회 결제**
- 개발자 이름/연락처 입력 (G2 Company Ltd 또는 개인)

## 2. 앱 만들기 + 스토어 등록정보
- **앱 만들기**: 이름 `신데렐라`, 기본 언어 한국어, 앱/게임=앱, 무료
- **스토어 등록정보 → 기본 정보** (아래 그대로 복붙):
  - **앱 이름**: `신데렐라 — 명품 공유 커뮤니티`
  - **짧은 설명(80자)**: `안 입는 명품, 페어리가 빌려드려요. 신뢰 기반 P2P 명품 대여 커뮤니티.`
  - **전체 설명**:
    ```
    ✦ 신데렐라 — 명품을 소유하지 않고 경험하세요 ✦

    옷장 속 잠든 명품, 이제 ‘페어리’가 되어 빌려주세요.
    특별한 날 하루, 부담 없이 명품을 빌려 쓰세요.

    • 둘러보기 — 가방·의류·주얼리·시계를 브랜드와 가격으로 탐색
    • 빌리기 — 마음에 드는 아이템에 대여 요청, 1:1 채팅으로 조율
    • 빌려주기 — 안 쓰는 명품을 등록하고 페어리가 되어 수익 창출
    • 안심 거래 — 보증금, 거래 타임라인, 증빙 사진으로 신뢰 보호
    • 찜 · 검색 · 거래 내역 관리까지 한 곳에서

    명품은 ‘사는 것’이 아니라 ‘경험하는 것’.
    신데렐라에서 더 많은 사람이 더 자주 빛나도록.

    ※ 대여 결제는 당사자 간 외부(계좌/간편송금)로 진행되며, 실물 명품의
       물리적 대여 서비스입니다.
    ```
  - **앱 카테고리**: 쇼핑 / 태그: 쇼핑, 라이프스타일
  - **연락처 이메일**: kgg2512@gmail.com
  - **그래픽 자산 업로드**:
    - 앱 아이콘 512: `public/icons/icon-512.png`
    - 피처 그래픽 1024×500: `public/icons/feature-graphic-1024x500.png`
    - 휴대전화 스크린샷(2장+): `play-store-assets/screen-login.png`, `screen-search.png`, `screenshot-1.png`, `screenshot-2.png`

## 3. 앱 콘텐츠 (정책 — 거부 1순위 구간, 정확히)
### 3-1. 개인정보처리방침
- URL: `https://cinderella-iota.vercel.app/privacy.html`

### 3-2. App access (로그인 필요 앱)
- “모든 기능에 로그인 필요” 선택 → **테스트 Google 계정** 자격 제공
- 리뷰 안내 메모(복붙): `Google 계정으로 로그인합니다. 제공된 테스트 계정 사용. 메인 기능: 아이템 탐색/상세 → 빌리기 요청 → 1:1 채팅. 신고는 아이템 상세·채팅에서, 차단은 채팅에서 가능. 회원탈퇴는 설정 화면에서 가능합니다.`

### 3-3. 광고 — “이 앱에는 광고가 없습니다” 선택 (현재 광고 없음)

### 3-4. 콘텐츠 등급 (IARC 설문 — 이렇게 답)
- 카테고리: **소셜/커뮤니케이션 또는 쇼핑**
- 폭력/성적 콘텐츠/욕설/약물/도박: **전부 없음(No)**
- **사용자 간 상호작용/소통: 예(Yes)** — 1:1 채팅 있음
- 사용자가 콘텐츠 생성/공유: **예(Yes)** — 물품 등록
- 위치 공유: 아니오
- 결과 등급은 보통 “전체이용가~만 12세” 수준 — 정직하게 답하면 됨

### 3-5. 데이터 보안 (Data Safety) — ⭐가장 중요, 아래 표대로
**수집함(Yes). 제3자 판매 안 함. 전송 중 암호화함. 사용자 삭제 요청 가능(앱 내 + 웹).**

| 데이터 유형 | 수집 | 목적 | 필수/선택 |
|---|---|---|---|
| 이메일 주소 | 예 | 계정 관리, 앱 기능 | 필수 |
| 이름 | 예 | 앱 기능(프로필) | 선택 |
| 사용자 ID | 예 | 계정 관리, 앱 기능 | 필수 |
| 사진(상품/증빙 이미지) | 예 | 앱 기능 | 선택 |
| 인앱 메시지(채팅) | 예 | 앱 기능 | 선택 |
| 앱 상호작용(등록/거래/찜) | 예 | 앱 기능, 분석 | 선택 |

- **결제/금융 정보: 수집 안 함** (대여 정산은 당사자 간 외부 처리, 앱은 카드/계좌 정보 미보유)
- **위치: 수집 안 함**
- 보안 관행: ☑ 전송 중 암호화 ☑ 사용자가 데이터 삭제 요청 가능
- **데이터 삭제 URL**: `https://cinderella-iota.vercel.app/account-deletion.html`
- ⚠️ GA4를 켜면(현재 꺼짐) “앱 상호작용 — 분석” 공유 항목 추가 필요

### 3-6. UGC(사용자 생성 콘텐츠) 정책 — Phase 3에서 코드 충족
- 신고: 아이템 상세 + 채팅 → 사유 선택 신고 (구현됨, `reports` 테이블 적재)
- 차단: 채팅에서 상대 차단 → 차단 유저 아이템 홈/검색 비노출 + 신규 채팅 차단 + **기존 채팅 목록 제외** (구현됨)
- 중복 신고 방지: `UNIQUE(reporter_id, target_type, target_id)` (스팸 신고 차단)
- **모더레이션 처리 경로(심사 질문 대비 답변)**:
  - 신고 접수 즉시 `reports` 테이블에 `status='pending'`으로 적재
  - 운영자가 Supabase 대시보드(service_role)에서 신고 검토 → 위반 시 해당 아이템 `status='hidden'` 처리 / 반복 위반 계정 `banned_until` 차단
  - 모더레이션 연락처: kgg2512@gmail.com (개인정보처리방침/등록정보 명시)
  - ⚠️ 후속 권장: 신고 도착 알림(Supabase Edge Function → 이메일/Slack)으로 검토 SLA 단축

## 4. 출시
- **권장 경로**: 비공개 테스트(내부 테스트) 트랙에 먼저 AAB 업로드 → 본인 기기 설치 검증 → 이상 없으면 **프로덕션 출시**(심사 보통 며칠)
- AAB 업로드: `android/app/build/outputs/bundle/release/app-release.aab`
- ⚠️ **Play App Signing 동의** + 업로드 키스토어(`android/release.keystore`) 백업 필수

## 정직 고지
- “심사 통과 보장”은 제출 주체가 회장이라 불가. Alpha 책임 한계 = 코드/자산/정책 항목 충족까지.
- 잠재 추가 거부 리스크: (a) 심사관 테스트 계정 미제공 시 “기능 확인 불가” 거부 → 2번 App access 필수, (b) 실제 명품 거래의 진위/위조품 책임은 운영 정책 영역(약관에 면책 명시 권장).
