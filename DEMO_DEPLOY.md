# 신데렐라 데모 모드 배포 가이드

투자 유치 프레젠테이션용 데모 버전 배포 절차입니다.
**코드베이스는 1개이며, 환경변수 `NEXT_PUBLIC_DEMO_MODE`로 실제 버전과 데모 버전을 분기합니다.**

- `NEXT_PUBLIC_DEMO_MODE=true`  → 데모 모드 (로그인·DB 없이 가짜 플로우)
- 미설정 또는 `false`           → 실제 버전 (현재 운영 코드 그대로)

데모 모드는 Supabase를 일절 호출하지 않으므로 실제 Supabase 자격증명이 없어도 동작합니다.
(`NEXT_PUBLIC_SUPABASE_*`는 빌드 통과용 placeholder만 넣으면 됩니다.)

---

## 1. 웹 데모 — Vercel 배포

1. Vercel 대시보드 → **New Project** → `kgg2512/Cinderella` import
2. **Project Name**: `cinderella-demo` (실제 운영 프로젝트와 별도)
3. **Environment Variables** (Production + Preview 모두):
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
   ```
   > `NEXT_PUBLIC_GA_MEASUREMENT_ID`는 데모에서 넣지 않습니다(분석 불필요).
4. **Deploy**

배포 후 `/login` 진입 → "✦ 데모로 체험하기 ✦" 버튼 → 홈으로 즉시 진입.

### CLI로 배포 (대안)
```bash
cd cinderella
npx vercel --prod \
  -e NEXT_PUBLIC_DEMO_MODE=true \
  -e NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
```

### 로컬에서 데모 미리보기
```bash
cd cinderella
NEXT_PUBLIC_DEMO_MODE=true \
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build && npm start
# http://localhost:3000/login 접속
```

---

## 2. Android 데모 APK 빌드 (로컬 실행)

Capacitor는 정적 익스포트(`output: 'export'`)를 사용합니다.
데모 환경변수를 주입한 채 모바일 빌드 → Capacitor 동기화 → Android Studio에서 APK 생성.

```bash
cd cinderella

# 1) 데모 환경변수로 모바일 정적 빌드
NEXT_PUBLIC_DEMO_MODE=true \
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build:mobile

# 2) Capacitor 동기화
npx cap sync android

# 3) Android Studio 열기
npx cap open android
```

Android Studio에서:
- **Build > Build Bundle(s) / APK(s) > Build APK(s)** (데모 시연은 debug 빌드로 충분)
- 생성된 `app-debug.apk`를 시연 기기에 설치

> 주의: `build:mobile`은 `CAPACITOR_BUILD=true`로 정적 익스포트하므로
> `output: 'export'` 모드가 됩니다. 데모 모드는 서버 라우트·API를 쓰지 않으므로
> 정적 익스포트와 완전히 호환됩니다.

---

## 3. 실제 버전과의 차이 (데모 모드에서 바뀌는 것)

| 화면 | 실제 버전 | 데모 모드 |
|------|-----------|-----------|
| 로그인 | Google OAuth | "데모로 체험하기" 버튼 → 홈 직행 |
| 홈 | Supabase 아이템 | DEMO_ITEMS 6개 고정 |
| 상세 | DB 단건 조회 | DEMO_ITEMS에서 조회 |
| 찜 | DB insert/delete | 로컬 state 토글만 |
| 빌리기 요청 | 거래 생성 | 2초 후 "데모: 실제 서비스에서 렌탈이 시작됩니다" |
| 채팅 | Realtime DB | 미리 작성된 페어리 "소피아" 대화 3줄 |
| 등록 | 폼 제출 → DB | 폼 비활성 + 안내 배너 |
| 상단 | (없음) | "✦ DEMO MODE — 투자자 프레젠테이션용 ✦" 띠 배너 |

실제 운영 코드는 `isDemoMode()` 조건 분기로만 감싸져 있어,
`NEXT_PUBLIC_DEMO_MODE`가 없으면 기존 동작과 100% 동일합니다.
