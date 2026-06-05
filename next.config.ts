import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

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

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
