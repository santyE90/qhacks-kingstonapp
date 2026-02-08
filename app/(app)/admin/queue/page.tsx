"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Issue } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

type QueueIssue = Issue;

const priorities = [
  { label: "Normal", value: 0 },
  { label: "High", value: 1 },
  { label: "Urgent", value: 2 },
];

export default function AdminQueuePage() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<QueueIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("issues")
        .select("id, title, description, category, address, status, priority, created_at, updated_at, created_by")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setIssues((data as QueueIssue[]) || []);
      }
      setLoading(false);
    };

    load();
  }, []);

  const handlePriorityChange = async (issueId: string, priority: number) => {
    const { error: updateError } = await supabase
      .from("issues")
      .update({ priority })
      .eq("id", issueId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setIssues((prev) =>
      [...prev]
        .map((issue) => (issue.id === issueId ? { ...issue, priority } : issue))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.created_at.localeCompare(b.created_at))
    );
  };

  if (profile?.role !== "admin") {
    return (
      <div className="surface-card rounded-2xl p-6 text-sm text-muted">
        Admins only.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">Admin queue</h2>
        <p className="text-sm text-muted">
          FIFO by default. Raise priority to move urgent issues to the front.
        </p>
      </div>

      {loading ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">Loading queue...</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="surface-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-[var(--font-heading)] text-lg font-semibold">{issue.title}</h3>
                <p className="text-xs text-muted">{issue.address}</p>
              </div>
              <StatusBadge status={issue.status} />
            </div>
            <p className="mt-2 text-sm text-muted">{issue.category}</p>
            <p className="mt-2 text-sm">{issue.description}</p>
            <label className="mt-3 block text-sm font-medium">
              Priority
              <select
                value={issue.priority ?? 0}
                onChange={(event) => handlePriorityChange(issue.id, Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
