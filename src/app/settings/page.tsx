"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";
import { isDemoMode } from "@/lib/demo";

interface SettingRow {
  label: string;
  sub?: string;
  href?: string;
  disabled?: boolean;
}

type NotifKey = "push" | "transaction" | "marketing";

interface NotifRow {
  key: NotifKey;
  label: string;
  sub: string;
}

const NOTIF_PREFS_STORAGE_KEY = "cinderella_notif_prefs";

const NOTIFICATION_ROWS: NotifRow[] = [
  { key: "push", label: "푸시 알림", sub: "새 대여 요청, 메시지 알림 (실제 발송 준비 중 · 선호만 저장)" },
  { key: "transaction", label: "거래 알림", sub: "입금·반납 등 거래 상태 변경 (선호만 저장)" },
  { key: "marketing", label: "마케팅 알림", sub: "혜택·이벤트 소식 (선호만 저장)" },
];

type NotifPrefs = Record<NotifKey, boolean>;

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  push: true,
  transaction: true,
  marketing: false,
};

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIF_PREFS;
  try {
    const raw = window.localStorage.getItem(NOTIF_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIF_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
    return {
      push: typeof parsed.push === "boolean" ? parsed.push : DEFAULT_NOTIF_PREFS.push,
      transaction:
        typeof parsed.transaction === "boolean" ? parsed.transaction : DEFAULT_NOTIF_PREFS.transaction,
      marketing:
        typeof parsed.marketing === "boolean" ? parsed.marketing : DEFAULT_NOTIF_PREFS.marketing,
    };
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

const ACCOUNT_ROWS: SettingRow[] = [
  { label: "계좌 등록", sub: "정산받을 은행 계좌", disabled: true },
  { label: "본인인증", sub: "신분증 인증 (준비 중)", disabled: true },
];

const INFO_ROWS: SettingRow[] = [
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "이용약관", href: "/terms" },
  { label: "앱 버전", sub: "1.0.0 (준비 중)", disabled: true },
  { label: "문의하기", sub: "준비 중", disabled: true },
];

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A09589" strokeWidth="1.5">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function NotificationRowItem({
  row,
  on,
  onToggle,
  isLast,
}: {
  row: NotifRow;
  on: boolean;
  onToggle: (key: NotifKey) => void;
  isLast: boolean;
}) {
  const rowClass = ["settings-row", isLast ? "settings-row--last" : ""].filter(Boolean).join(" ");
  return (
    <div className={rowClass}>
      <div>
        <div className="settings-row-label">{row.label}</div>
        <div className="settings-row-sub">{row.sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on ? "true" : "false"}
        aria-label={`${row.label} ${on ? "켜짐" : "꺼짐"}`}
        className={`settings-toggle settings-toggle--btn${on ? " settings-toggle--on" : ""}`}
        onClick={() => onToggle(row.key)}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}

function SettingRowItem({ row, isLast }: { row: SettingRow; isLast: boolean }) {
  const rowClass = [
    "settings-row",
    row.disabled && !row.href ? "settings-row--disabled" : "",
    isLast ? "settings-row--last" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <div>
        <div className="settings-row-label">{row.label}</div>
        {row.sub && <div className="settings-row-sub">{row.sub}</div>}
      </div>
      <ChevronIcon />
    </>
  );

  if (row.href) {
    return (
      <Link href={row.href} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(loginPathWithNext());
    });
  }, [router]);

  // localStorage에서 알림 선호 복원 (새로고침해도 유지)
  useEffect(() => {
    // 클라이언트 전용 값(localStorage) 읽기 → 하이드레이션 후 setState가 정답(불일치 방지). 1회성, 캐스케이드 아님.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifPrefs(loadNotifPrefs());
  }, []);

  const handleNotifToggle = (key: NotifKey) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(NOTIF_PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage 접근 불가(시크릿 모드 등) 시 상태만 유지
      }
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 회원 탈퇴 (스토어 필수 요건). 데모 모드에서는 실제 삭제 없이 로그인 화면으로.
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (isDemoMode()) {
      setShowDeleteModal(false);
      router.push("/login");
      return;
    }
    setDeleting(true);
    const { error } = await supabase.rpc("delete_current_user");
    if (error) {
      setDeleting(false);
      setDeleteError("탈퇴 처리 중 오류가 발생했습니다. 진행 중인 거래가 없는지 확인 후 다시 시도해주세요.");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login?deleted=1");
  };

  return (
    <div className="settings-bg">
      {/* 탑바 */}
      <div className="topbar">
        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="topbar-logo topbar-title">설정</div>
        <div className="topbar-spacer" />
      </div>

      {/* 알림 섹션 */}
      <div className="my-section-title">알림</div>
      <div className="settings-section-block">
        {NOTIFICATION_ROWS.map((row, i) => (
          <NotificationRowItem
            key={row.key}
            row={row}
            on={notifPrefs[row.key]}
            onToggle={handleNotifToggle}
            isLast={i === NOTIFICATION_ROWS.length - 1}
          />
        ))}
      </div>

      {/* 계정 섹션 */}
      <div className="my-section-title">계정</div>
      <div className="settings-section-block">
        {ACCOUNT_ROWS.map((row, i) => (
          <SettingRowItem key={row.label} row={row} isLast={i === ACCOUNT_ROWS.length - 1} />
        ))}
      </div>

      {/* 앱 정보 섹션 */}
      <div className="my-section-title">앱 정보</div>
      <div className="settings-section-block">
        {INFO_ROWS.map((row, i) => (
          <SettingRowItem key={row.label} row={row} isLast={i === INFO_ROWS.length - 1} />
        ))}
      </div>

      {/* 로그아웃 */}
      <div className="settings-logout-wrap">
        <button
          type="button"
          className="my-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </div>

      {/* 회원 탈퇴 (위험 구역 — 스토어 필수) */}
      <div className="settings-danger-wrap">
        <button
          type="button"
          className="settings-delete-btn"
          onClick={() => {
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
        >
          회원 탈퇴
        </button>
        <p className="settings-delete-help">
          탈퇴 시 프로필·찜·등록 물품 등 개인정보가 삭제되며 다시 로그인할 수 없습니다.
          거래 기록은 관련 법령에 따라 일정 기간 보존됩니다.
        </p>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="delete-modal">
            <h2 id="delete-modal-title" className="delete-modal-title">
              정말 탈퇴하시겠어요?
            </h2>
            <p className="delete-modal-body">
              계정과 개인정보(프로필·찜·등록 물품)가 영구적으로 삭제되며 복구할 수 없습니다.
              진행 중인 거래가 있다면 먼저 마무리해주세요.
            </p>
            {deleteError && <p className="delete-modal-error">{deleteError}</p>}
            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="delete-modal-confirm"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "탈퇴 처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
