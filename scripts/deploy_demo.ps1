# 신데렐라 — 데모(작업용 스테이징) 슬롯 배포
# Vercel 프로젝트: cinderella-staging → https://cinderella-staging.vercel.app
# 데모/스토어 이원화 원칙(회장 지시 2026-07-10): 모든 작업은 이 슬롯에서 먼저 검증 후 스토어 승격.
# ⚠️ cinderella-demo 프로젝트(투자자용 가짜 플로우, 회장 연결)는 건드리지 말 것 — 별개 아티팩트.
# 토큰: OS User env VERCEL_TOKEN

$ErrorActionPreference = "Stop"
$env:VERCEL_ORG_ID = "team_Dz8Zt5PuBl67OhD5hQN6lNIv"
$env:VERCEL_PROJECT_ID = "prj_hYRL98xZS2A9zmy86SeGPUFW3U4y"   # cinderella-staging

Set-Location (Split-Path $PSScriptRoot -Parent)
npx vercel deploy --prod --yes --token $env:VERCEL_TOKEN
if ($LASTEXITCODE -ne 0) { Write-Host "데모 배포 실패" -ForegroundColor Red; exit 1 }
Write-Host "데모 슬롯 배포 완료 — 검증 후 scripts/deploy_store.ps1 로 승격" -ForegroundColor Green
