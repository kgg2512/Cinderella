# 신데렐라 — 데모(작업용 스테이징) 슬롯 배포
# Vercel 프로젝트: cinderella-demo → https://cinderella-demo.vercel.app
# 데모/스토어 이원화 원칙(회장 지시 2026-07-10): 모든 작업은 이 슬롯에서 먼저 검증 후 스토어 승격.
# 토큰: OS User env VERCEL_TOKEN

$ErrorActionPreference = "Stop"
$env:VERCEL_ORG_ID = "team_Dz8Zt5PuBl67OhD5hQN6lNIv"
$env:VERCEL_PROJECT_ID = "prj_uUohuwV49xv68tkW5cy2XrTjWbKW"   # cinderella-demo

Set-Location (Split-Path $PSScriptRoot -Parent)
npx vercel deploy --prod --yes --token $env:VERCEL_TOKEN
if ($LASTEXITCODE -ne 0) { Write-Host "데모 배포 실패" -ForegroundColor Red; exit 1 }
Write-Host "데모 슬롯 배포 완료 — 검증 후 scripts/deploy_store.ps1 로 승격" -ForegroundColor Green
