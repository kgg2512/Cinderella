"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import type { TransactionStatus } from "@/types/transaction";
import { TRANSACTION_STATUS_LABEL } from "@/types/transaction";

interface TxCard {
  id: string;
  status: TransactionStatus;
  lender_id: string;
  borrower_id: string;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  item?: { id: string; title: string; brand: string | null; images: string[] } | null;
  lender?: { name: string | null; avatar_url: string | null } | null;
  borrower?: { name: string | null; avatar_url: string | null } | null;
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

type TxAction = {
  label: string;
  nextStatus: TransactionStatus;
};

function getAction(tx: TxCard, myId: string): TxAction | null {
  const isLender = tx.lender_id === myId;
  const isBorrower = tx.borrower_id === myId;
  const s = tx.status;

  if (s === "requested" && isLender)
    return { label: "수락", nextStatus: "deposit_requested" };
  if (s === "deposit_requested" && isLender)
    return { label: "보증금 확인 완료", nextStatus: "deposit_confirmed" };
  if (s === "deposit_confirmed" && isLender)
    return { label: "전달 완료", nextStatus: "handed_over" };
  if (s === "handed_over" && isBorrower)
    return { label: "반납 완료", nextStatus: "returned" };
  if (s === "returned" && isLender)
    return { label: "거래 완료", nextStatus: "completed" };
  return null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"borrowing" | "lending">("borrowing");
  const [lending, setLending] = useState<TxCard[]>([]);
  const [borrowing, setBorrowing] = useState<TxCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTransactions = useCallback(async (userId: string) => {
    const [lendingRes, borrowingRes] = await Promise.all([
      supabase
        .from("transactions")
        .select(`
          id, status, lender_id, borrower_id, start_date, end_date, deposit_amount,
          item:items(id, title, brand, images),
          borrower:users!transactions_borrower_id_fkey(name, avatar_url)
        `)
        .eq("lender_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select(`
          id, status, lender_id, borrower_id, start_date, end_date, deposit_amount,
          item:items(id, title, brand, images),
          lender:users!transactions_lender_id_fkey(name, avatar_url)
        `)
        .eq("borrower_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (lendingRes.error) console.error("대여 조회 오류:", lendingRes.error);
    if (borrowingRes.error) console.error("빌림 조회 오류:", borrowingRes.error);

    setLending((lendingRes.data ?? []) as TxCard[]);
    setBorrowing((borrowingRes.data ?? []) as TxCard[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(loginPathWithNext()); return; }
      setMyId(user.id);
      await loadTransactions(user.id);
    })();
  }, [router, loadTransactions]);

  const handleAction = async (tx: TxCard, nextStatus: TransactionStatus) => {
    setUpdatingId(tx.id);
    // Supabase 제네릭 타입이 update payload를 과도하게 좁히는 문제 — untyped 클라이언트로 우회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db
      .from("transactions")
      .update({ status: nextStatus })
      .eq("id", tx.id);

    if (error) {
      console.error("상태 업데이트 오류:", error);
    } else {
      const updateList = (list: TxCard[]): TxCard[] =>
        list.map((t) => (t.id === tx.id ? { ...t, status: nextStatus } : t));
      setLending((prev) => updateList(prev));
      setBorrowing((prev) => updateList(prev));
    }
    setUpdatingId(null);
  };

  const list = tab === "lending" ? lending : borrowing;

  return (
    <div className="min-h-screen">
      <div className="topbar">
        <div className="topbar-logo">내 거래</div>
      </div>

      {/* 탭 */}
      <div className="tx-list-tab">
        <button
          type="button"
          className={`tx-tab-btn${tab === "borrowing" ? " active" : ""}`}
          onClick={() => setTab("borrowing")}
        >
          빌린 것 ({borrowing.length})
        </button>
        <button
          type="button"
          className={`tx-tab-btn${tab === "lending" ? " active" : ""}`}
          onClick={() => setTab("lending")}
        >
          빌려준 것 ({lending.length})
        </button>
      </div>

      {loading ? (
        <div className="tx-empty">
          <div className="tx-empty-icon">...</div>
          <div>불러오는 중</div>
        </div>
      ) : list.length === 0 ? (
        <div className="tx-empty">
          <div className="tx-empty-icon">📦</div>
          <div>
            {tab === "borrowing"
              ? "아직 빌린 거래가 없습니다."
              : "아직 빌려준 거래가 없습니다."}
          </div>
        </div>
      ) : (
        list.map((tx) => {
          const thumb = tx.item?.images?.[0];
          const counterpart = tab === "lending" ? tx.borrower : tx.lender;
          const role = tab === "lending" ? "빌린 분" : "대여자";
          const action = myId ? getAction(tx, myId) : null;
          const isUpdating = updatingId === tx.id;

          return (
            <div key={tx.id} className="tx-card-wrap">
              <Link href={`/transactions/${tx.id}`} className="tx-card tx-card--no-border">
                <div className="tx-card-thumb">
                  {thumb ? (
                    <img src={thumb} alt={tx.item?.title ?? "물품"} />
                  ) : (
                    <div className="tx-card-thumb" />
                  )}
                </div>
                <div className="tx-card-info">
                  {tx.item?.brand && (
                    <div className="tx-card-brand">{tx.item.brand}</div>
                  )}
                  <div className="tx-card-name">{tx.item?.title ?? "물품"}</div>
                  <div className="tx-card-date">
                    {role}: {counterpart?.name ?? "알 수 없음"}
                  </div>
                  <div className="tx-card-date">
                    {tx.start_date} ~ {tx.end_date}
                  </div>
                </div>
                <span className={`status-pill ${STATUS_CSS[tx.status]}`}>
                  {TRANSACTION_STATUS_LABEL[tx.status]}
                </span>
              </Link>

              {/* 액션 버튼 — 역할+상태 조건부 */}
              {action && (
                <div className="tx-action-btn-wrap">
                  <button
                    type="button"
                    className="tx-action-btn"
                    onClick={() => handleAction(tx, action.nextStatus)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "처리 중..." : action.label}
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
