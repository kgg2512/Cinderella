import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SWCleanup from "@/components/SWCleanup";
import DemoBanner from "@/components/DemoBanner";

export const viewport: Viewport = {
  themeColor: "#D4AF37",
};

export const metadata: Metadata = {
  title: "신데렐라 — 명품 공유 커뮤니티",
  description: "서로의 명품을 나누는 프리미엄 P2P 렌탈 커뮤니티",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "신데렐라",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // 보안(MED-6): Capacitor 정적 익스포트 빌드는 headers() 미적용 → 모바일 웹뷰 CSP를 meta로 주입.
  // 웹(Vercel) 빌드는 next.config headers()의 CSP를 쓰므로 이 태그를 렌더하지 않음.
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

  return (
    <html lang="ko">
      <body className="bg-cream min-h-screen">
        {isCapacitorBuild && (
          <meta
            httpEquiv="Content-Security-Policy"
            content={[
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; ")}
          />
        )}
        {/* 박제 서비스워커 강제 해제 — 로그인 루프 최종 수정 (2026-06-12) */}
        <SWCleanup />
        {/* GA4 — 환경변수 NEXT_PUBLIC_GA_MEASUREMENT_ID 미입력 시 비활성 */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        {/* 데모 모드 상단 띠 배너 (NEXT_PUBLIC_DEMO_MODE=true 시에만) */}
        <DemoBanner />
        <Navbar />
        <main className="max-w-md mx-auto pb-24">{children}</main>
      </body>
    </html>
  );
}
