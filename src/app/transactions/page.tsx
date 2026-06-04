"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { TransactionStatus } from "@/types/transaction";
import { TRANSACTION_STATUS_LABEL } from "@/types/transaction";

interface TxCard {
  id: string;
  status: TransactionStatus;
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

export default function TransactionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"borrowing" | "lending">("borrowing");
  const [lending, setLending] = useState<TxCard[]>([]);
  const [borrowing, setBorrowing] = useState<TxCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const [lendingRes, borrowingRes] = await Promise.all([
        supabase
          .from("transactions")
          .select(`
            id, status, start_date, end_date, deposit_amount,
            item:items(id, title, brand, images),
            borrower:users!transactions_borrower_id_fkey(name, avatar_url)
          `)
          .eq("lender_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select(`
            id, status, start_date, end_date, deposit_amount,
            item:items(id, title, brand, images),
            lender:users!transactions_lender_id_fkey(name, avatar_url)
          `)
          .eq("borrower_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setLending((lendingRes.data ?? []) as TxCard[]);
      setBorrowing((borrowingRes.data ?? []) as TxCard[]);
      setLoading(false);
    })();
  }, [router]);

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

          return (
            <Link key={tx.id} href={`/transactions/${tx.id}`} className="tx-card">
              <div className="tx-card-thumb">
                {thumb ? (
                  <img src={thumb} alt={tx.item?.title ?? "물품"} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--ivory)" }} />
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
          );
        })
      )}
    </div>
  );
}
