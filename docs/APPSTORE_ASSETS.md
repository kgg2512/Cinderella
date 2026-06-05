# 신데렐라 — 앱스토어 제출 그래픽 가이드

## 브랜드 컬러 (확정)

| 역할 | HEX | RGB |
|------|-----|-----|
| Primary Gold | `#B8963E` | (184, 150, 62) |
| Gold Light | `#D4AF37` | (212, 175, 55) |
| Background | `#1A1816` | (26, 24, 22) |
| Cream | `#FAF9F7` | (245, 249, 247) |

---

## 현재 생성 완료 파일 (`public/icons/`)

| 파일 | 크기 | 용도 | 상태 |
|------|------|------|------|
| `icon-192.png` | 192×192 | PWA 아이콘, Android Chrome | ✅ 완료 |
| `icon-512.png` | 512×512 | Google Play 앱 아이콘, PWA splash | ✅ 완료 |
| `feature-graphic-1024x500.png` | 1024×500 | Google Play Feature Graphic | ✅ 완료 |

---

## Google Play 제출 필수 그래픽

### 1. 앱 아이콘 (512×512) ✅
- 파일: `public/icons/icon-512.png`
- 요건: 32-bit PNG, 알파 없음, 최대 1MB
- 현재 상태: 생성 완료

### 2. Feature Graphic (1024×500) ✅
- 파일: `public/icons/feature-graphic-1024x500.png`
- 요건: JPG 또는 24-bit PNG, 알파 없음
- 현재 상태: 생성 완료

### 3. 스크린샷 (최소 2장) ⚠️ 미완료
- 요건: 최소 320px, 최대 3840px, 가로세로 비율 2:1 초과 금지
- 권장: 1080×1920 (세로형 모바일)
- **필요 화면**: 홈/탐색, 상품 상세, 피팅/예약 플로우
- 생성 방법: Playwright로 실제 앱 스크린샷 캡처 (아래 참고)

---

## PWA manifest.json 현황

```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```
- `maskable` purpose 추가 완료 — Google Play TWA 제출 조건 충족

---

## 스크린샷 생성 방법 (CDO 참고용)

```javascript
// Playwright로 앱 스크린샷 캡처
mcp__playwright__browser_navigate(url: "http://localhost:3000")
mcp__playwright__browser_resize(width: 390, height: 844)   // iPhone 14 비율
mcp__playwright__browser_take_screenshot(name: "cinderella_home")
// → 저장 후 1080×1920 리사이즈
```

---

## Google Play 콘솔 제출 체크리스트

- [x] 앱 아이콘 512×512 PNG
- [x] Feature Graphic 1024×500 PNG
- [x] manifest.json `maskable` purpose
- [ ] 스크린샷 최소 2장 (1080×1920)
- [ ] 앱 설명 (한국어, 최대 4000자)
- [ ] 콘텐츠 등급 설문
- [ ] 개인정보 처리방침 URL (현재: `/privacy.html` 배포 필요)

---

## 업데이트 이력

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2026-06-05 | PWA 아이콘 2종 + Feature Graphic 생성, manifest maskable 추가 | CDO |
