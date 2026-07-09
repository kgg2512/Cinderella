/**
 * features.ts — 빌드타임 기능 플래그
 *
 * NEXT_PUBLIC_* 규칙에 따라 빌드타임에 인라인된다(호출 비용 0, SSR/CSR 동일 값).
 */

/**
 * 결제(토스 송금) UI 노출 여부.
 *
 * 무료 커뮤니티 베타 + 앱스토어/플레이 초기 심사 동안 기본 **비노출**.
 * 사유:
 *   - P2P 실물 렌탈 보증금 송금은 IAP 예외(Apple 3.1.3(e)/3.1.5·person-to-person)로
 *     기술적으로는 허용되나, 심사원이 외부 결제앱 딥링크를 문제 삼는 왕복을 원천 차단.
 *   - toss.me 딥링크는 한국 외 심사원 기기에서 무동작 → "깨진 버튼"으로 보일 위험.
 * 비노출 시에도 보증금 금액·수령 아이디·확인 버튼은 유지되어 거래 흐름은 끊기지 않는다.
 *
 * 정식 출시 시 NEXT_PUBLIC_PAYMENTS_ENABLED=true 로 활성화.
 */
export const paymentsEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
