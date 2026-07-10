<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 🎭 데모/스토어 이원화 (회장 지시 2026-07-10 — 위반 금지)

| 슬롯 | Vercel 프로젝트 | 배포 |
|------|----------------|------|
| **데모(작업용 스테이징)** | `cinderella-demo` | `scripts/deploy_demo.ps1` |
| **스토어(운영)** | `cinderella` | `scripts/deploy_store.ps1` |

**작업 절차 (웹·앱 공통 기본):** master에서 작업 → `deploy_demo.ps1` → 데모 URL 검증 PASS → `deploy_store.ps1` 승격. 스토어 직행 금지.
- 두 슬롯 모두 수동 CLI 배포(깃 자동배포 없음). git push 자체는 어떤 슬롯도 안 건드린다.
- 데모 슬롯은 실모드(실제 Supabase)로 돈다 = 진짜 스테이징. 투자자용 가짜 플로우 데모가 필요하면 `DEMO_DEPLOY.md`대로 `NEXT_PUBLIC_DEMO_MODE=true`를 얹어 데모 슬롯에 배포.
- 알려진 한계: ①데모·스토어가 같은 Supabase DB 공유(스테이징 DB 분리는 추후) ②Google OAuth 리다이렉트 허용목록에 데모 도메인 등록 필요(로그인 검증 시).
- 앱(플레이스토어/앱스토어) 빌드도 동일 원칙: 데모 웹 검증 PASS된 코드로만 스토어 제출 빌드.
- 슬롯 URL: 데모 = https://cinderella-demo.vercel.app / 스토어(운영) = https://cinderella-iota.vercel.app
