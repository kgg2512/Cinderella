import TransactionDetailClient from "./TransactionDetailClient";

// 아래 블록은 build:mobile(scripts/capacitor-build.mjs)이 빌드 중 자동 치환한다.
// 웹: dynamicParams=true → 실제 id 요청 시 렌더 (이전 false 고정 시 웹에서 404 발생)
// Capacitor(output:'export'): dynamicParams=false + placeholder — export 모드는 true 미지원
// @capacitor-swap
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default function TransactionDetailPage() {
  return <TransactionDetailClient />;
}
