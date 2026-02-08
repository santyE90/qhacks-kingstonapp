"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function TopBar() {
  const { profile, effectiveRole, viewAsCitizen } = useAuth();
  const roleLabel =
    effectiveRole === "admin"
      ? "Admin"
      : effectiveRole === "staff"
      ? "Staff"
      : "Resident";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/feed" className="flex items-center gap-3">
          <div className="surface-accent-strong flex h-10 w-10 items-center justify-center rounded-2xl">
            <img src="/logo.png" alt="KingstonFix logo" className="h-8 w-8 rounded-xl object-cover" />
          </div>
          <div>
            <p className="font-[var(--font-heading)] text-lg font-semibold accent-text">KingstonConnect</p>
            <p className="text-xs text-muted">Making Our City Better, One Step at a Time.</p>
          </div>
        </Link>
        <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-muted">
          {roleLabel}
          {profile?.role === "admin" && viewAsCitizen ? " (View)" : ""}
        </div>
      </div>
    </header>
  );
}
