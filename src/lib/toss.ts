/**
 * 토스/카카오페이 딥링크 유틸
 * 플랫폼이 돈을 만지지 않는 P2P 보증금 직접 송금 링크 생성
 */

/**
 * 토스 프로필 송금 링크 생성
 * @param tossId 수령자의 토스 아이디 (@ 없이)
 * @param amount 보증금 금액 (원)
 * @param description 송금 메모
 */
export function getTossDeeplink(
  tossId: string,
  amount: number,
  description: string
): string {
  const encodedDesc = encodeURIComponent(description);
  // 모바일: toss://send, 웹 fallback: toss.me 프로필 페이지
  return `https://toss.me/${tossId}?amount=${amount}&message=${encodedDesc}`;
}

/**
 * 카카오페이 송금 딥링크
 * @param amount 송금 금액 (원)
 */
export function getKakaoPayLink(amount: number): string {
  return `kakaopay://transfer?amount=${amount}`;
}

/**
 * 보증금 금액 계산 (일 임대료의 200%)
 * @param pricePerDay 일 임대료
 */
export function calcDeposit(pricePerDay: number): number {
  return pricePerDay * 2;
}
