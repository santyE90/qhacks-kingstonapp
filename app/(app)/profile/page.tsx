"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, signOut, viewAsCitizen, setViewAsCitizen } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <section className="space-y-4">
      <div className="surface-card rounded-3xl p-5">
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">Profile</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="text-muted">Name:</span> {profile?.full_name || "Resident"}
          </p>
          <p>
            <span className="text-muted">Email:</span> {user?.email}
          </p>
          <p>
            <span className="text-muted">Role:</span> {profile?.role || "citizen"}
          </p>
        </div>
      </div>
      {profile?.role === "admin" ? (
        <div className="surface-card rounded-2xl p-4">
          <h3 className="font-[var(--font-heading)] text-lg font-semibold">Admin view</h3>
          <p className="mt-1 text-sm text-muted">
            Toggle between admin tools and the citizen experience.
          </p>
          <label className="mt-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
            View as citizen
            <input
              type="checkbox"
              checked={viewAsCitizen}
              onChange={(event) => setViewAsCitizen(event.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>
      ) : null}
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold"
      >
        Sign out
      </button>
    </section>
  );
}
