import type { TransactionStatus } from "@/types/transaction";
import { TRANSACTION_STATUS_ORDER } from "@/types/transaction";

interface TimelineStep {
  status: TransactionStatus;
  label: string;
  subLabel: string;
  date?: string;
}

interface TransactionTimelineProps {
  currentStatus: TransactionStatus;
}

const STEPS: TimelineStep[] = [
  {
    status: "requested",
    label: "빌리기 요청",
    subLabel: "수락 대기 중",
  },
  {
    status: "deposit_requested",
    label: "보증금 요청됨",
    subLabel: "토스로 보증금을 보내주세요.",
  },
  {
    status: "deposit_confirmed",
    label: "보증금 확인 완료",
    subLabel: "보증금이 확인되었습니다. 물건을 전달해주세요.",
  },
  {
    status: "handed_over",
    label: "전달 완료",
    subLabel: "물건이 전달되었습니다. 소중히 사용해주세요.",
  },
  {
    status: "returned",
    label: "반납 완료",
    subLabel: "반납되었습니다. 물건 상태를 확인해주세요.",
  },
  {
    status: "completed",
    label: "거래 완료",
    subLabel: "거래가 완료되었습니다.",
  },
];

function getStepState(
  stepStatus: TransactionStatus,
  currentStatus: TransactionStatus
): "done" | "current" | "pending" {
  if (currentStatus === "disputed") {
    // disputed는 별도 표시 — 모든 완료 단계를 done으로
    const currentIdx = TRANSACTION_STATUS_ORDER.indexOf("returned");
    const stepIdx = TRANSACTION_STATUS_ORDER.indexOf(stepStatus);
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "current";
    return "pending";
  }

  const currentIdx = TRANSACTION_STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = TRANSACTION_STATUS_ORDER.indexOf(stepStatus);

  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "pending";
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function InnerDot() {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#FAF9F7",
      }}
    />
  );
}

export default function TransactionTimeline({ currentStatus }: TransactionTimelineProps) {
  const isDisputed = currentStatus === "disputed";

  return (
    <div className="tx-timeline">
      {isDisputed && (
        <div
          className="status-pill s-disputed"
          style={{ marginBottom: 14, alignSelf: "flex-start" }}
        >
          분쟁 접수
        </div>
      )}
      <div className="tx-timeline-inner">
        <div className="tx-connector" />
        {STEPS.map((step) => {
          const state = getStepState(step.status, currentStatus);
          return (
            <div key={step.status} className="tx-step">
              <div className="tx-dot-wrap">
                {state === "done" && (
                  <div className="tx-dot-done">
                    <CheckIcon />
                  </div>
                )}
                {state === "current" && (
                  <div className="tx-dot-current">
                    <InnerDot />
                  </div>
                )}
                {state === "pending" && (
                  <div className="tx-dot-pending" />
                )}
              </div>
              <div className="tx-step-content">
                <div className={`tx-step-label ${state}`}>{step.label}</div>
                {state !== "pending" && (
                  <div className="tx-step-sub">{step.subLabel}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
