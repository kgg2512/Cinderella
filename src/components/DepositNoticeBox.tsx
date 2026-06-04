interface DepositNoticeBoxProps {
  className?: string;
}

/**
 * 보증금 안내 박스 — CMO 카피 적용
 * 플랫폼 비보관 원칙을 신뢰 소구로 전달
 */
export default function DepositNoticeBox({ className = "" }: DepositNoticeBoxProps) {
  return (
    <div className={`deposit-notice-box ${className}`}>
      <div className="deposit-notice-title">보증금 안내</div>
      <p className="deposit-notice-line">
        이 거래는 토스를 통해 보증금을 직접 주고받습니다.
      </p>
      <p className="deposit-notice-line">
        플랫폼은 거래 기록만 보관하며 금전을 보관하지 않습니다.
      </p>
    </div>
  );
}
