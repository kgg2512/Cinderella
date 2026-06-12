"use client";

import { useEffect } from "react";

/**
 * SWCleanup — 박제 서비스워커 강제 해제 (2026-06-12, 로그인 루프 최종 수정)
 *
 * 배경:
 *   과거 @ducanh2912/next-pwa(register:true)가 /sw.js를 등록하고 옛 빌드를
 *   precache + CacheFirst로 박제했다. 이 SW가 살아있는 기기(회장 기기 등)는
 *   새 배포(OAuth 콜백 픽스 포함)가 도달하지 못해 로그인 루프가 영구 지속된다.
 *
 *   public/sw.js를 "킬스위치"로 교체했지만 그것만으로는 부족하다 —
 *   브라우저의 SW 업데이트 체크는 구 SW가 /sw.js 자체를 캐싱했거나
 *   updateViaCache 정책에 따라 무력화될 수 있어, 킬스위치가 회장 기기에
 *   영영 도달하지 못할 수 있다 (이전 3회 수정이 회장 기기에서 실패한 진짜 이유).
 *
 * 해결:
 *   SW 업데이트 체크에 의존하지 않고, 앱이 로드되는 즉시 클라이언트 JS가 직접
 *   getRegistrations()로 모든 SW를 unregister + 모든 캐시를 삭제한다.
 *   HTML 문서는 일반 네트워크 요청이므로 이 컴포넌트의 JS는 박제 SW가 살아있어도
 *   (CacheFirst가 _next 정적 청크를 가로채더라도 신규 청크 해시는 캐시 미스 →
 *   네트워크로 떨어짐) 최소 한 번은 실행될 기회를 얻는다.
 *   해제에 성공하면 1회만 reload하여 깨끗한(SW 없는) 상태로 재진입시킨다.
 *
 * 무한 reload 방지:
 *   sessionStorage 가드("__sw_purged")로 세션당 reload는 최대 1회.
 *
 * 렌더링 출력 없음 — 부수효과 전용 컴포넌트.
 */

const PURGE_GUARD_KEY = "__sw_purged_v1";

export default function SWCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        let unregisteredAny = false;

        for (const reg of regs) {
          try {
            const ok = await reg.unregister();
            if (ok) unregisteredAny = true;
          } catch {
            // 개별 해제 실패는 무시하고 계속 진행
          }
        }

        // 박제 SW가 남긴 모든 Cache Storage 삭제 (precache 포함)
        if ("caches" in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch {
            // 캐시 삭제 실패는 무시
          }
        }

        if (cancelled) return;

        // 실제로 SW를 해제했을 때만 1회 reload (세션당 1회 가드)
        if (unregisteredAny) {
          let alreadyPurged = false;
          try {
            alreadyPurged = sessionStorage.getItem(PURGE_GUARD_KEY) === "1";
            sessionStorage.setItem(PURGE_GUARD_KEY, "1");
          } catch {
            // sessionStorage 차단 환경: reload는 건너뛴다 (무한 루프 방지 우선)
            alreadyPurged = true;
          }
          if (!alreadyPurged) {
            window.location.reload();
          }
        }
      } catch {
        // getRegistrations 자체 실패(미지원 등)는 조용히 무시
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
