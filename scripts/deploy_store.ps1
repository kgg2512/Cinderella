# 신데렐라 — 스토어(운영) 슬롯 배포 = 승격
# Vercel 프로젝트: cinderella (운영 도메인)
# ⚠️ 데모 슬롯(scripts/deploy_demo.ps1) 검증 PASS 없이 직접 실행 금지.
# 토큰: OS User env VERCEL_TOKEN

$ErrorActionPreference = "Stop"
$env:VERCEL_ORG_ID = "team_Dz8Zt5PuBl67OhD5hQN6lNIv"
$env:VERCEL_PROJECT_ID = "prj_RytkTJ1NWxDhZKqlYMBAOT1VgAT9"   # cinderella (store)

Set-Location (Split-Path $PSScriptRoot -Parent)
npx vercel deploy --prod --yes --token $env:VERCEL_TOKEN
if ($LASTEXITCODE -ne 0) { Write-Host "스토어 배포 실패" -ForegroundColor Red; exit 1 }
Write-Host "스토어(운영) 승격 완료" -ForegroundColor Green
