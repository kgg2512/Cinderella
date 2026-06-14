import { isDemoMode } from "@/lib/demo";

/**
 * DemoBanner — 투자 PT 데모 모드 상단 띠 배너.
 * NEXT_PUBLIC_DEMO_MODE=true 일 때만 렌더된다(빌드타임 인라인).
 * 서버 컴포넌트로 두어 추가 클라이언트 JS 비용 없음.
 */
export default function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="demo-banner" role="note" aria-label="데모 모드 안내">
      ✦ DEMO MODE — 투자자 프레젠테이션용 ✦
    </div>
  );
}
