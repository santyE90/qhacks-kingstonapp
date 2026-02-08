"use client";

import { useEffect, useState } from "react";
import IssueCard from "@/components/IssueCard";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/client";
import type { Issue, IssueMedia } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

type IssueRow = Issue & { issue_media: IssueMedia[] };

const IssueMap = dynamic(() => import("@/components/IssueMap"), { ssr: false });

export default function FeedPage() {
  const { session } = useAuth();
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!session?.user) return;
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("issues")
        .select("id, title, description, category, address, status, latitude, longitude, priority, created_at, updated_at, created_by, issue_media(id, type, url)")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const all = (data as IssueRow[]) || [];
        setIssues(all);
      }

      setLoading(false);
    };

    fetchIssues();
  }, [session]);

  return (
    <section className="space-y-4">
      <div className="hero-panel px-5 py-5">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            Community pulse
          </p>
          <h2 className="mt-2 font-[var(--font-heading)] text-2xl font-semibold">
            Keep Kingston Moving.
          </h2>
          <p className="mt-1 text-sm text-muted">
            Report issues fast and follow the fixes as they happen.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-heading)] text-xl font-semibold">Issue Feed</h2>
          <p className="text-sm text-muted">Latest reports from residents.</p>
        </div>
      </div>

      {issues.length ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Map view.</p>
          <IssueMap issues={issues} />
        </div>
      ) : null}

      {loading ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">Loading issues...</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !issues.length ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">
          No issues yet. Be the first to report one.
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
