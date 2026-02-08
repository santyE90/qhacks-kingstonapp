"use client";

import { useEffect, useState } from "react";
import IssueCard from "@/components/IssueCard";
import { supabase } from "@/lib/supabase/client";
import type { Issue, IssueMedia } from "@/lib/types";

type IssueRow = Issue & { issue_media: IssueMedia[] };

export default function ProgressPage() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("issues")
        .select("id, title, description, category, address, status, latitude, longitude, created_at, updated_at, created_by, issue_media(id, type, url)")
        .in("status", ["in_progress", "resolved"])
        .order("updated_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setIssues((data as IssueRow[]) || []);
      }
      setLoading(false);
    };

    fetchIssues();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">In progress & resolved</h2>
        <p className="text-sm text-muted">
          See what the city is working on and what’s already been fixed.
        </p>
      </div>

      {loading ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">Loading...</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !issues.length ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">
          No in-progress or resolved issues yet.
        </div>
      ) : null}

      <div className="grid gap-4">
        {issues.map((issue) => {
          const cover = issue.issue_media?.find((media) => media.type === "before") || null;
          return <IssueCard key={issue.id} issue={issue} cover={cover} />;
        })}
      </div>
    </section>
  );
}
