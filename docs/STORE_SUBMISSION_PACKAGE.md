# 신데렐라 스토어 제출 입력값 패키지 (회장 복붙용)

> 절차·체크리스트는 `STORE_SUBMISSION_CHECKLIST.md`. 이 문서는 **각 스토어 폼에 그대로 넣을 실제 값**.
> 법무 근거: g2-clo 검토(2026-06-21, privacy.html/terms.html v1.1). **변호사 아님 — 정식 제출 전 변호사 최종검토 권고.**
> Data Safety / Privacy Nutrition 값은 실제 코드 수집과 Privacy Manifest에 **정합 완료**.

---

## 0. 공통
- 앱 이름: **신데렐라 (Cinderella)**
- 패키지/번들 ID: `com.g2company.cinderella`
- 카테고리: **쇼핑(Shopping)**
- 개인정보처리방침 URL: `https://[배포도메인]/privacy` ← 웹 배포 후 확정
- 이용약관 URL: `https://[배포도메인]/terms`
- 결제: **플랫폼 미경유 P2P 외부 송금**(토스/카카오 딥링크). 앱내결제(IAP) 없음. 수수료 0%.
- 광고/추적: **없음**

---

## 1. Google Play Console

### 스토어 등록정보
- **짧은 설명(80자)**: 명품을 사지 말고 빌려보세요. 개인 간 안전하게 주고받는 명품 대여 커뮤니티.
- **전체 설명**:
```
신데렐라는 개인이 가진 명품(가방·시계·주얼리·의류 등)을 다른 개인에게 빌려주고 빌리는 P2P 명품 대여 커뮤니티입니다.

• 페어리(대여자)가 직접 물품을 등록하고, 원하는 사람이 대여를 요청합니다.
• 보증금·대여료는 토스/카카오페이로 당사자 간 직접 송금 — 플랫폼은 수수료를 받지 않습니다(수수료 0%).
• 채팅으로 거래를 조율하고, 거래 증빙 사진으로 물품 상태를 확인합니다.
• Google 계정으로 간편하게 시작하세요.

신데렐라는 통신판매중개자로서 거래 당사자 간 자유로운 거래를 중개하며, 거래의 책임은 당사자에게 있습니다.
```
- 앱 아이콘 512, 피처그래픽 1024×500, 폰 스크린샷 2장+ → `play-store-assets/`, `public/icons/`

### Data Safety (데이터 안전) 폼
| 질문 | 답변 |
|---|---|
| 데이터 수집 | **예** |
| 이메일 주소 | 예 — 앱 기능(계정 관리) · 전송중 암호화 · 삭제요청 가능 |
| 이름 | 예 — 앱 기능(서비스 내 표시) |
| 사진/동영상 | 예 — 앱 기능(물품 사진·거래 증빙) |
| 메시지(앱 내 채팅) | 예 — 앱 기능(거래 소통) |
| 데이터 공유 | 예 — **Google LLC**(소셜 로그인 인증 처리 목적)만 |
| 전송중 암호화 | **예**(TLS 1.2+) |
| 삭제 요청 가능 | **예**(앱 내 회원탈퇴) |
| 13세 미만 아동 대상 | **아니오** |

### 콘텐츠 등급 설문
- 폭력/성적/혐오/약물/도박 콘텐츠: **전부 없음** → 전체이용가
- 사용자 간 상호작용(채팅): **예** → 신고·차단 기능 보유 명시
- 사용자 위치 공유: 아니오

### 권한 사용 사유 (Play "권한" 섹션)
- 카메라: 물품/거래 증빙 사진 촬영
- 사진/미디어: 물품 사진 첨부
- (READ_EXTERNAL_STORAGE는 Android 12 이하 폴백, maxSdk32)

---

## 2. Apple App Store

### Info.plist 권한 사용 설명 (Mac에서 `cap add ios` 후 ios/App/App/Info.plist에 추가)
```xml
<key>NSCameraUsageDescription</key>
<string>상품 및 거래 증빙 사진을 촬영하기 위해 카메라를 사용합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>상품/증빙 이미지를 첨부하기 위해 사진 보관함에 접근합니다.</string>
```
> `PrivacyInfo.xcprivacy`는 `ios-templates/`에 준비됨 → `ios/App/App/`로 복사. (PaymentInfo·DeviceID 제거, Name·채팅 반영 완료)

### Privacy Nutrition Label (App Store Connect)
| 카테고리 | 수집 | 추적 | 목적 |
|---|---|---|---|
| Contact Info — Email Address | 예 | 아니오 | App Functionality |
| Contact Info — Name | 예 | 아니오 | App Functionality |
| User Content — Photos or Videos | 예 | 아니오 | App Functionality |
| User Content — Other User Content(채팅) | 예 | 아니오 | App Functionality |
| Identifiers — User ID | 예 | 아니오 | App Functionality |
> Usage Data(Analytics)는 **GA 미연동(키 비어있음)이라 현재 제외**. GA 연동 시 "Product Interaction / Analytics" 추가.

### 심사 메모 (App Review Notes)
```
1) 계정 삭제(가이드라인 5.1.1(v)): 앱 내 [설정 > 회원 탈퇴]에서 즉시 삭제 가능합니다.
   개인정보는 익명화되고, 거래기록은 전자상거래법상 보존 후 익명화됩니다.
2) 결제: 본 앱은 실물 명품의 개인 간 대여 서비스로, 결제는 당사자 간 외부 송금
   (토스/카카오페이)으로 이루어지며 앱내결제(IAP) 대상이 아닙니다.
3) 데모 계정: [회장 제공 — Google 테스트 계정 또는 게스트 둘러보기(?demo=true)]
4) 로그인 없이 둘러보기 경로 제공.
```

### Sign in with Apple (가이드라인 4.8) — ⚠️ 회장 결정 필요
현재 Google 로그인만 제공. 제3자 로그인을 쓰면 Apple은 **Sign in with Apple 동시 제공을 요구**할 수 있음(거절 사유). 정식 제출 전 Apple 로그인 추가 여부 결정 필요. (데모/심사용은 무관, 정식 출시 전 결정)

---

## 3. 법적 잔여 — 회장 결정·정식 출시 전 (g2-clo)
> 블로커 3건은 privacy/terms v1.1로 **해소 완료**. 아래는 권고(베타 중 처리):
- 🟡 P2P 결제 분쟁 안전장치(에스크로/보증금 중재 면책 문구) — 약관 제10조 보강 권고
- 🟡 명품 진품확인(감정서 제출) 약관 문구 vs 실제 미구현 — 정합 필요
- 🟡 Supabase **DPA/SCC 체결**(국외이전 근거) — 정식 계정에서 계약
- 🟡 환불 처리 주체(P2P라 플랫폼이 환불 불가 — "대여자 직접 반환" 명확화)
- 🟡 연령 확인 수단(만 19세 — 자기선언 체크박스 최소)
- ✅ 변호사 최종검토(정식 제출 전)
