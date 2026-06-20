"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import TransactionTimeline from "@/components/TransactionTimeline";
import TossPaymentBtn from "@/components/TossPaymentBtn";
import EvidenceUploadBtn from "@/components/EvidenceUploadBtn";
import DepositNoticeBox from "@/components/DepositNoticeBox";
import {
  acceptTransaction,
  confirmDeposit,
  confirmHandover,
  confirmReturn,
} from "../client-actions";
import type { TransactionStatus } from "@/types/transaction";
import { TRANSACTION_STATUS_LABEL } from "@/types/transaction";

interface TxDetail {
  id: string;
  status: TransactionStatus;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  toss_id?: string | null;
  lender_id: string;
  borrower_id: string;
  lender_confirmed_handover: boolean;
  borrower_confirmed_handover: boolean;
  lender_confirmed_return: boolean;
  borrower_confirmed_return: boolean;
  item?: { id: string; title: string; brand: string | null; images: string[]; price_per_day: number } | null;
  lender?: { id: string; name: string | null; avatar_url: string | null } | null;
  borrower?: { id: string; name: string | null; avatar_url: string | null } | null;
}

const STATUS_CSS: Record<TransactionStatus, string> = {
  requested: "s-requested",
  deposit_requested: "s-deposit-requested",
  deposit_confirmed: "s-deposit-confirmed",
  handed_over: "s-handed-over",
  returned: "s-returned",
  completed: "s-completed",
  disputed: "s-disputed",
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState("");
  const [tossInputId, setTossInputId] = useState("");
  const [showTossInput, setShowTossInput] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace(loginPathWithNext()); return; }
    setMyId(user.id);

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        item:items(id, title, brand, images, price_per_day),
        lender:users!transactions_lender_id_fkey(id, name, avatar_url),
        borrower:users!transactions_borrower_id_fkey(id, name, avatar_url)
      `)
      .eq("id", id)
      .single();

    if (error || !data) { router.replace("/transactions"); return; }
    setTx(data as TxDetail);
    setLoading(false);
  }, [id, router]);

  // load()는 async — setState는 await 이후(getUser 등) 발생, effect 본문 동기 setState 아님. 규칙 오탐.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setWorking(true);
    const result = await fn();
    if (result.success) {
      await load();
    } else {
      showToast(result.error ?? "오류가 발생했습니다.");
    }
    setWorking(false);
  };

  if (loading || !tx || !myId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted text-sm">불러오는 중...</div>
      </div>
    );
  }

  const isLender = myId === tx.lender_id;
  const isBorrower = myId === tx.borrower_id;
  const item = tx.item;
  const thumbUrl = item?.images?.[0] ?? "https://images.unsplash.com/photo-1529025530948-67e8a5c69b58?auto=format&fit=crop&w=200&q=70";

  return (
    <div className="min-h-screen pb-8">
      {/* 탑바 */}
      <div className="topbar">
        <button type="button" className="topbar-icon-btn" onClick={() => router.back()} aria-label="뒤로가기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="topbar-logo">거래 상세</div>
        <span className={`status-pill status-pill--topbar ${STATUS_CSS[tx.status]}`}>
          {TRANSACTION_STATUS_LABEL[tx.status]}
        </span>
      </div>

      {/* 물품 카드 */}
      <div className="tx-item-card">
        <div className="tx-item-thumb">
          <img src={thumbUrl} alt={item?.title ?? "물품"} />
        </div>
        <div className="tx-item-detail">
          {item?.brand && (
            <div className="tx-card-brand">{item.brand}</div>
          )}
          <div className="tx-item-title-lg">
            {item?.title ?? "물품"}
          </div>
          <div className="tx-card-date">
            {tx.start_date} ~ {tx.end_date}
          </div>
        </div>
      </div>

      {/* 보증금 안내 */}
      <DepositNoticeBox />

      {/* 타임라인 */}
      <div className="tx-section">
        <div className="tx-section-label">거래 진행 현황</div>
        <TransactionTimeline currentStatus={tx.status} />
      </div>

      {/* 상태별 액션 */}
      <div className="tx-action-area tx-action-area--padded">

        {/* requested: 대여자에게 수락 요청 */}
        {tx.status === "requested" && isLender && (
          <div>
            <div className="deposit-notice-box deposit-notice-box--flush-mb">
              <div className="deposit-notice-title">수락 안내</div>
              <p className="deposit-notice-line">
                수락 시 토스 아이디를 등록해 빌리는 분이 보증금을 보낼 수 있도록 합니다.
              </p>
            </div>
            {!showTossInput ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowTossInput(true)}
              >
                빌리기 요청 수락하기
              </button>
            ) : (
              <div className="tx-action-stack--gap10">
                <div>
                  <label htmlFor="toss-id-input" className="form-label">토스 아이디 (@ 없이 입력)</label>
                  <input
                    id="toss-id-input"
                    type="text"
                    className="form-input"
                    placeholder="예: honggildong"
                    value={tossInputId}
                    onChange={(e) => setTossInputId(e.target.value.replace(/^@/, ""))}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={working || !tossInputId.trim()}
                  onClick={() => run(() => acceptTransaction(tx.id, tossInputId.trim()))}
                >
                  {working ? "처리 중..." : "수락 완료"}
                </button>
              </div>
            )}
          </div>
        )}

        {tx.status === "requested" && isBorrower && (
          <div className="deposit-notice-box deposit-notice-box--flush">
            <div className="deposit-notice-title">대기 중</div>
            <p className="deposit-notice-line">대여자의 수락을 기다리고 있습니다.</p>
          </div>
        )}

        {/* deposit_requested: 보증금 토스 전송 */}
        {tx.status === "deposit_requested" && isBorrower && tx.toss_id && (
          <div className="tx-action-stack">
            <div className="deposit-summary-box">
              <div className="deposit-summary-row">
                <span>보증금</span>
                <span className="deposit-summary-amount">₩{tx.deposit_amount.toLocaleString()}</span>
              </div>
              <div className="deposit-summary-row">
                <span>수령 아이디</span>
                <span>@{tx.toss_id}</span>
              </div>
            </div>
            <TossPaymentBtn
              tossId={tx.toss_id}
              amount={tx.deposit_amount}
              description={`신데렐라 보증금 — ${item?.title ?? "거래"}`}
            />
            <button
              type="button"
              className="btn-primary--dark"
              disabled={working}
              onClick={() => run(() => confirmDeposit(tx.id))}
            >
              {working ? "처리 중..." : "보증금 보냈어요"}
            </button>
          </div>
        )}

        {tx.status === "deposit_requested" && isLender && (
          <div className="deposit-notice-box deposit-notice-box--flush">
            <div className="deposit-notice-title">대기 중</div>
            <p className="deposit-notice-line">빌리는 분이 보증금을 보내는 중입니다.</p>
          </div>
        )}

        {/* deposit_confirmed: 양측 전달 확인 + 사진 업로드 */}
        {tx.status === "deposit_confirmed" && (
          <div className="tx-action-stack">
            <div className="tx-section-label--flush">전달 전 상태 기록</div>
            <EvidenceUploadBtn
              transactionId={tx.id}
              photoType="before_handover"
              onUploaded={() => showToast("증거 사진이 등록되었습니다.")}
            />
            {isLender && !tx.lender_confirmed_handover && (
              <button
                type="button"
                className="btn-primary"
                disabled={working}
                onClick={() => run(() => confirmHandover(tx.id, "lender"))}
              >
                {working ? "처리 중..." : "물건 전달 확인 (대여자)"}
              </button>
            )}
            {isBorrower && !tx.borrower_confirmed_handover && (
              <button
                type="button"
                className="btn-primary"
                disabled={working}
                onClick={() => run(() => confirmHandover(tx.id, "borrower"))}
              >
                {working ? "처리 중..." : "물건 받았어요 확인 (빌린 분)"}
              </button>
            )}
            {((isLender && tx.lender_confirmed_handover) ||
              (isBorrower && tx.borrower_confirmed_handover)) && (
              <div className="deposit-notice-box deposit-notice-box--flush">
                <p className="deposit-notice-line">확인 완료. 상대방의 확인을 기다리고 있습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* handed_over: 반납 확인 + 사진 업로드 */}
        {(tx.status === "handed_over" || tx.status === "returned") && (
          <div className="tx-action-stack">
            <div className="tx-section-label--flush">반납 후 상태 기록</div>
            <EvidenceUploadBtn
              transactionId={tx.id}
              photoType="after_return"
              onUploaded={() => showToast("증거 사진이 등록되었습니다.")}
            />
            {isLender && !tx.lender_confirmed_return && (
              <button
                type="button"
                className="btn-primary"
                disabled={working}
                onClick={() => run(() => confirmReturn(tx.id, "lender"))}
              >
                {working ? "처리 중..." : "반납 확인 (대여자)"}
              </button>
            )}
            {isBorrower && !tx.borrower_confirmed_return && (
              <button
                type="button"
                className="btn-primary"
                disabled={working}
                onClick={() => run(() => confirmReturn(tx.id, "borrower"))}
              >
                {working ? "처리 중..." : "반납했어요 확인 (빌린 분)"}
              </button>
            )}
            {((isLender && tx.lender_confirmed_return) ||
              (isBorrower && tx.borrower_confirmed_return)) && (
              <div className="deposit-notice-box deposit-notice-box--flush">
                <p className="deposit-notice-line">확인 완료. 상대방의 확인을 기다리고 있습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* completed: 보증금 반환 안내 */}
        {tx.status === "completed" && (
          <div>
            {isLender && tx.toss_id && (
              <div className="tx-action-stack">
                <div className="deposit-notice-box deposit-notice-box--flush">
                  <div className="deposit-notice-title">거래 완료</div>
                  <p className="deposit-notice-line">
                    거래가 완료되었습니다. 빌린 분께 보증금을 토스로 돌려주세요.
                  </p>
                </div>
                <div className="deposit-summary-box">
                  <div className="deposit-summary-row">
                    <span>반환할 보증금</span>
                    <span className="deposit-summary-total-bold">₩{tx.deposit_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            {isBorrower && (
              <div className="deposit-notice-box deposit-notice-box--flush">
                <div className="deposit-notice-title">거래 완료</div>
                <p className="deposit-notice-line">
                  거래가 완료되었습니다. 대여자가 보증금을 돌려드릴 예정입니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* disputed */}
        {tx.status === "disputed" && (
          <div className="deposit-notice-box deposit-notice-box--disputed">
            <div className="deposit-notice-title--disputed">분쟁 접수</div>
            <p className="deposit-notice-line">분쟁이 접수되었습니다. 고객센터가 확인 중입니다.</p>
          </div>
        )}
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
