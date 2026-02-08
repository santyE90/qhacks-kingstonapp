"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import { useAuth } from "./AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
