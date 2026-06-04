"use client";

import { getTossDeeplink } from "@/lib/toss";

interface TossPaymentBtnProps {
  tossId: string;
  amount: number;
  description?: string;
  disabled?: boolean;
}

/**
 * 토스 직접 송금 버튼 — CDO 스펙 적용
 * 클릭 시 토스 앱 딥링크로 이동 (플랫폼 무결제 원칙)
 */
export default function TossPaymentBtn({
  tossId,
  amount,
  description = "신데렐라 보증금",
  disabled = false,
}: TossPaymentBtnProps) {
  const handleClick = () => {
    if (disabled) return;
    const link = getTossDeeplink(tossId, amount, description);
    window.open(link, "_blank");
  };

  return (
    <button
      type="button"
      className="btn-toss-payment"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`토스로 ${amount.toLocaleString()}원 보내기`}
    >
      <span className="toss-btn-amount">
        ₩{amount.toLocaleString()} 보내기
      </span>
      <span className="toss-btn-sub">
        토스 앱으로 이동합니다 · @{tossId}
      </span>
    </button>
  );
}
