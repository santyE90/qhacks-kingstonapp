"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { UpdatePost } from "@/lib/types";

export default function UpdatesPage() {
  const { user, profile, effectiveRole } = useAuth();
  const [updates, setUpdates] = useState<UpdatePost[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isStaff = effectiveRole === "staff" || effectiveRole === "admin";

  useEffect(() => {
    const loadUpdates = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("updates")
        .select("id, created_by, title, body, created_at")
        .order("created_at", { ascending: false });
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setUpdates((data as UpdatePost[]) || []);
      }
      setLoading(false);
    };

    loadUpdates();
  }, []);

  const handleCreateUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    setError(null);

    const { data, error: insertError } = await supabase
      .from("updates")
      .insert({
        created_by: user.id,
        title: title.trim(),
        body: body.trim(),
      })
      .select("id, created_by, title, body, created_at")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setUpdates((prev) => [data as UpdatePost, ...prev]);
      setTitle("");
      setBody("");
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">City updates</h2>
        <p className="text-sm text-muted">Official updates from city staff.</p>
      </div>

      {isStaff ? (
        <form onSubmit={handleCreateUpdate} className="surface-card space-y-3 rounded-2xl p-4">
          <h3 className="font-[var(--font-heading)] text-lg font-semibold">Post update</h3>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Update title"
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What's happening?"
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white"
          >
            Publish update
          </button>
        </form>
      ) : null}

      {loading ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">Loading updates...</div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !updates.length ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">
          No updates yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {updates.map((update) => (
          <div key={update.id} className="surface-card rounded-2xl p-4">
            <h3 className="font-[var(--font-heading)] text-lg font-semibold">{update.title}</h3>
            <p className="mt-2 text-sm">{update.body}</p>
            <p className="mt-3 text-xs text-muted">
              {new Date(update.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
