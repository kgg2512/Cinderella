/**
 * 서비스워커 킬스위치 (2026-06-12)
 *
 * 과거 next-pwa가 등록한 SW가 옛날 빌드를 통째로 정적 캐싱(precache + CacheFirst)해
 * 새 배포(OAuth 픽스 등)가 기존 방문자에게 도달하지 않는 사고가 발생했다.
 * 이 파일은 같은 경로(/sw.js)로 배포되어 브라우저의 SW 업데이트 체크 시
 * 기존 SW를 대체한 뒤: 모든 캐시 삭제 → 자기 자신 등록 해제 → 열린 탭 새로고침.
 *
 * 삭제 금지 — 삭제하면(404) 기존 등록자의 낡은 SW가 갱신 없이 계속 살아남는다.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});
