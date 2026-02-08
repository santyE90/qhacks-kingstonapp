"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const IconFeed = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 6h16M4 12h16M4 18h10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconPlus = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconBell = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 9a6 6 0 1112 0v4l2 3H4l2-3V9z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M9 19a3 3 0 006 0" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const IconUser = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconMap = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M9 3v15M15 6v15"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconProgress = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12a8 8 0 1116 0 8 8 0 01-16 0z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M12 7v5l3 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const items: NavItem[] = [
    { href: "/feed", label: "Feed", icon: IconFeed },
    { href: "/issues/new", label: "New", icon: IconPlus },
    { href: "/map", label: "Map", icon: IconMap },
    { href: "/progress", label: "Progress", icon: IconProgress },
    { href: "/updates", label: "Updates", icon: IconBell },
    ...(profile?.role === "admin"
      ? [{ href: "/admin/queue", label: "Queue", icon: IconProgress }]
      : []),
    { href: "/profile", label: "Profile", icon: IconUser },
  ];

  return (
    <nav className="bottom-nav sticky bottom-0 z-30">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
