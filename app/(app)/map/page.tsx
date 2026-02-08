"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/client";
import type { Issue } from "@/lib/types";

const IssueMap = dynamic(() => import("@/components/IssueMap"), { ssr: false });

export default function MapPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("issues")
        .select("id, title, description, category, address, status, latitude, longitude, created_at, updated_at, created_by")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setIssues((data as Issue[]) || []);
      }
      setLoading(false);
    };

    load();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">City map</h2>
        <p className="text-sm text-muted">
          Pins appear for issues with coordinates (optional during submission).
        </p>
      </div>

      {loading ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-muted">Loading map...</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading ? <IssueMap issues={issues} /> : null}
    </section>
  );
}
