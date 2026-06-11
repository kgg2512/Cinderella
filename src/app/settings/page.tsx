"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loginPathWithNext } from "@/lib/login-next";

interface SettingRow {
  label: string;
  sub?: string;
  href?: string;
  disabled?: boolean;
  toggle?: boolean;
}

const NOTIFICATION_ROWS: SettingRow[] = [
  { label: "푸시 알림", sub: "새 대여 요청, 메시지 알림", toggle: true, disabled: true },
  { label: "거래 알림", sub: "입금·반납 등 거래 상태 변경", toggle: true, disabled: true },
  { label: "마케팅 알림", sub: "혜택·이벤트 소식", toggle: true, disabled: true },
];

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

function TogglePill({ disabled }: { disabled?: boolean }) {
  return (
    <div className={`settings-toggle${disabled ? " settings-toggle--disabled" : ""}`}>
      <div className="settings-toggle-knob" />
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
      {row.toggle ? <TogglePill disabled={row.disabled} /> : <ChevronIcon />}
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(loginPathWithNext());
    });
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
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
          <SettingRowItem key={row.label} row={row} isLast={i === NOTIFICATION_ROWS.length - 1} />
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
    </div>
  );
}
