import type { NextConfig } from "next";

// 환경 변수로 빌드 모드 분기
// CAPACITOR_BUILD=true  → 정적 익스포트 (Capacitor 모바일 앱용)
// 기본값 (미설정)        → 서버 사이드 빌드 (웹/Vercel 배포용)
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },

  // Capacitor 빌드 시 정적 익스포트 활성화
  // 주의: output:'export' 모드에서는 headers(), rewrites(), API Routes 동작 안 함
  // CSP 헤더는 Capacitor 네이티브 앱에서는 Meta 태그로 대체 또는 CF Worker에서 처리
  ...(isCapacitorBuild
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true }, // 정적 익스포트: Image Optimization 비활성화 필수
      }
    : {
        turbopack: {},
        // CISO 지시: GA4 CSP 헤더 (웹 배포 시에만 적용)
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                {
                  key: "Content-Security-Policy",
                  value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob: https:",
                    "font-src 'self' data:",
                    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
                    "frame-ancestors 'none'",
                  ].join("; "),
                },
                // CISO P1: HSTS + X-Frame + Content-Type 스니핑 방지
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              ],
            },
          ];
        },
      }),
};

// PWA 서비스워커 제거 (2026-06-12 결정):
// SW가 옛날 번들을 무기한 캐싱해 배포가 기존 방문자에게 도달하지 않는 사고 발생
// (OAuth 픽스가 회장 브라우저에 반영 안 됨). public/sw.js는 기존 등록자의
// SW·캐시를 자폭시키는 킬스위치로 교체됨 — 삭제 금지.
export default nextConfig;
