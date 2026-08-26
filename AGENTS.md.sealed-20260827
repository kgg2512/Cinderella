<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 🎭 데모/스토어 이원화 (회장 지시 2026-07-10 — 위반 금지)

| 슬롯 | Vercel 프로젝트 | 배포 |
|------|----------------|------|
| **데모(작업용 스테이징)** | `cinderella-staging` | `scripts/deploy_demo.ps1` |
| **스토어(운영)** | `cinderella` | `scripts/deploy_store.ps1` |

**작업 절차 (웹·앱 공통 기본):** master에서 작업 → `deploy_demo.ps1` → 데모 URL 검증 PASS → `deploy_store.ps1` 승격. 스토어 직행 금지.
- 두 슬롯 모두 수동 CLI 배포(깃 자동배포 없음). git push 자체는 어떤 슬롯도 안 건드린다.
- 데모 슬롯은 실모드(실제 Supabase)로 돈다 = 진짜 스테이징.
- ⚠️ **투자자용 데모는 별개 아티팩트**: Vercel `cinderella-demo` 프로젝트 = `kgg2512/cinderella-demo` 레포(가짜 플로우 하드와이어, 회장 2026-07-02 직접 연결) → https://cinderella-demo.vercel.app — **작업용 스테이징 배포로 덮지 말 것.** 갱신은 그 레포에 push로만.
- 🔒 **스테이징 DB 격리 (하드룰, 2026-07-11 보안감사 — 위반 금지):** 스테이징(`cinderella-staging`)은 **반드시 프로덕션과 분리된 Supabase 프로젝트**를 써야 한다. 프로덕션 ref(`aykdkbjydinujcevuxls`)를 스테이징 Vercel env(`NEXT_PUBLIC_SUPABASE_URL`)에 절대 복사하지 말 것 — 스테이징 테스트 매물이 실사용자에게 진짜 매물로 노출되고, 스테이징 스크립트/버그가 실운영 데이터를 훼손한다(RLS는 행 단위 통제일 뿐 테이블/유저풀 분리는 못 함).
  - ⚠️ **미해결(2026-07-11 확정):** 조직(`kgg2512's Org`)이 **Supabase free 플랜 = 활성 프로젝트 2개 한도**이고 Cinderella+welkor 둘 다 활성이라 이미 꽉 참. (미사용 ARC는 회장 승인으로 삭제했으나, ARC는 *정지* 상태라 활성 슬롯을 안 먹고 있었어서 삭제해도 슬롯이 안 생김 — 무료 격리 프로젝트 확보 실패 확인.) **실 옵션:** (a)Supabase Pro $25/mo=3번째 활성 프로젝트(완전 격리) (b)프로덕션 프로젝트 내 별도 `staging` 스키마(무료, 마켓플레이스 테이블은 격리되나 `auth.users` 공유·앱 `db.schema` 설정 작업 필요) (c)스테이징 실배포 시점까지 보류(현재 라이브 위험 0).
  - ✅ **회장 결정(2026-07-11): 옵션 (c) 보류 확정.** 스테이징 미배포라 라이브 위험 0 + 하드룰이 footgun 차단 중이므로 추가 과금/작업 없음. **스테이징을 실제로 배포해야 하는 시점에** (a)Supabase Pro 또는 (b)프로덕션 내 `staging` 스키마로 **먼저 격리한 뒤** 배포할 것. 그 전까지 스테이징 배포 금지(🔒 하드룰 유효).
- 알려진 한계: Google OAuth 리다이렉트 허용목록에 데모 도메인 등록 필요(로그인 검증 시).
- 앱(플레이스토어/앱스토어) 빌드도 동일 원칙: 데모 웹 검증 PASS된 코드로만 스토어 제출 빌드.
- 슬롯 URL: 데모(스테이징) = https://cinderella-staging.vercel.app / 스토어(운영) = https://cinderella-iota.vercel.app / 투자자데모(불변) = https://cinderella-demo.vercel.app
