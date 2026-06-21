"use client";

/**
 * ReportSheet — 재사용 신고 바텀시트 (아이템 상세 / 채팅방 공용)
 *
 * - 사유(라디오) 선택 + 선택적 상세 입력 → onSubmit(reason, detail).
 * - 데모/실모드 분기는 부모가 onSubmit 구현에서 담당(이 컴포넌트는 UI만).
 * - 기존 CSS 클래스(.sheet-overlay / .date-sheet / .sheet-handle / .btn-primary) 재사용.
 * - 접근성: role=dialog, aria-modal, 라벨 연결, ESC/배경 클릭 닫기.
 *
 * 구현 노트:
 *   내부 본문(ReportSheetInner)을 open=true일 때만 마운트한다.
 *   → 열릴 때마다 fresh state로 시작하므로 effect 내 setState(reset)가 불필요
 *     (react-hooks/set-state-in-effect 회피). 닫히면 언마운트되어 입력값도 자동 폐기.
 */
import { useEffect, useRef, useState } from "react";
import { REPORT_REASONS } from "@/app/safety/client-actions";

interface Props {
  open: boolean;
  title: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string, detail: string) => void;
}

export default function ReportSheet({ open, ...rest }: Props) {
  if (!open) return null;
  return <ReportSheetInner {...rest} />;
}

function ReportSheetInner({
  title,
  submitting,
  onClose,
  onSubmit,
}: Omit<Props, "open">) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  // 마운트 직후 첫 옵션 포커스(키보드 내비 시작점) + ESC 닫기 구독.
  // 외부 시스템(DOM 포커스 / window 이벤트) 동기화이므로 effect 사용이 적절하다.
  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [submitting, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="date-sheet">
        <div className="sheet-handle" />
        <div className="sheet-name">{title}</div>
        <div className="sheet-sub">신고 내용은 운영팀이 검토합니다</div>

        <fieldset className="report-reason-list">
          <legend className="date-input-label">신고 사유</legend>
          {REPORT_REASONS.map((r, i) => (
            <label key={r.value} className="report-reason-item">
              <input
                ref={i === 0 ? firstRef : undefined}
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="report-detail-wrap">
          <label htmlFor="report-detail" className="date-input-label">
            상세 내용 (선택)
          </label>
          <textarea
            id="report-detail"
            className="report-detail-input"
            value={detail}
            maxLength={1000}
            rows={3}
            placeholder="구체적인 상황을 적어주시면 검토에 도움이 됩니다."
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={submitting || !reason}
          onClick={() => onSubmit(reason, detail.trim())}
        >
          {submitting ? "접수 중..." : "신고 제출"}
        </button>
        <button
          type="button"
          className="report-cancel-btn"
          disabled={submitting}
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
}
