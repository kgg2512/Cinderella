"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/search", label: "검색", icon: SearchIcon },
  { href: "/items/new", label: "등록", icon: PlusIcon, center: true },
  { href: "/chats", label: "채팅", icon: ChatIcon },
  { href: "/wishlist", label: "좋아요", icon: HeartIcon },
  { href: "/profile", label: "마이", icon: UserIcon },
];

const HIDE_ON = ["/login", "/auth"];
// 채팅방(/chats/[id])은 하단 입력 바와 겹치므로 네비 숨김 (목록 /chats 는 표시)
const HIDE_PATTERNS = [/^\/chats\/.+/];

export default function Navbar() {
  const pathname = usePathname();

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;
  if (HIDE_PATTERNS.some((re) => re.test(pathname))) return null;

  return (
    <nav className="navbar" aria-label="하단 네비게이션">
      {NAV_ITEMS.map(({ href, label, icon: Icon, center }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`nav-btn${active ? " active" : ""}`}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            <Icon active={active} center={center} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean; center?: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean; center?: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean; center?: boolean }) {
  return (
    <div className={`nav-center${active ? " active" : ""}`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
  );
}

function ChatIcon({ active }: { active: boolean; center?: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean; center?: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.7}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean; center?: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
