"use client";

import { useRef, useState } from "react";
import { uploadTransactionPhoto } from "@/app/transactions/actions";

interface EvidenceUploadBtnProps {
  transactionId: string;
  photoType: "before_handover" | "after_return";
  onUploaded?: (photoId: string, publicUrl: string) => void;
}

const LABEL: Record<"before_handover" | "after_return", string> = {
  before_handover: "전달 전 상태 사진 업로드",
  after_return: "반납 후 상태 사진 업로드",
};

const HINT: Record<"before_handover" | "after_return", string> = {
  before_handover: "물건의 현재 상태를 촬영해주세요. 분쟁 시 증거로 사용됩니다.",
  after_return: "반납된 물건 상태를 촬영해주세요.",
};

/**
 * 거래 증거 사진 업로드 버튼 — CDO 스펙 적용
 * idle → uploading → done 상태 전환
 */
export default function EvidenceUploadBtn({
  transactionId,
  photoType,
  onUploaded,
}: EvidenceUploadBtnProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done">("idle");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 허용 MIME — CISO 스펙
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("JPG, PNG, WebP 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("10MB 이하 파일만 업로드 가능합니다.");
      return;
    }

    setError(null);
    setState("uploading");

    // 로컬 썸네일 미리보기 (FileReader)
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setThumbnail(ev.target.result as string);
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("photo", file);

    const result = await uploadTransactionPhoto(transactionId, photoType, fd);

    if (result.success) {
      setState("done");
      onUploaded?.(result.data.photoId, result.data.publicUrl);
    } else {
      setState("idle");
      setError(result.error);
    }
  };

  const stateClass =
    state === "uploading" ? "uploading" : state === "done" ? "done" : "";

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-hidden="true"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={`btn-evidence-upload ${stateClass}`}
        onClick={() => state === "idle" && inputRef.current?.click()}
        disabled={state === "uploading" || state === "done"}
        aria-label={LABEL[photoType]}
      >
        {state === "done" && thumbnail && (
          <img src={thumbnail} alt="증거 사진" />
        )}
        {state === "done" ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            증거 등록됨
          </>
        ) : state === "uploading" ? (
          "업로드 중..."
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {LABEL[photoType]}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs mt-1" style={{ color: "#C62828" }}>{error}</p>
      )}
      {state === "idle" && (
        <p className="deposit-notice-line mt-1">{HINT[photoType]}</p>
      )}
    </div>
  );
}
