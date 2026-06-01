import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "신데렐라 — 명품 공유 커뮤니티",
  description: "서로의 명품을 나누는 프리미엄 P2P 렌탈 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-cream min-h-screen">
        <Navbar />
        <main className="max-w-md mx-auto pb-24">{children}</main>
      </body>
    </html>
  );
}
