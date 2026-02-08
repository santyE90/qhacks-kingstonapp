"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Comment, Issue, IssueMedia, IssueStatus } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import ImageStrip from "@/components/ImageStrip";
import StatusBadge from "@/components/StatusBadge";

type IssueRow = Issue & { issue_media: IssueMedia[] };

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const issueId = params.id;
  const { profile, user, effectiveRole } = useAuth();
  const [issue, setIssue] = useState<IssueRow | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const beforeMedia = useMemo(
    () => issue?.issue_media?.filter((item) => item.type === "before") || [],
    [issue]
  );
  const afterMedia = useMemo(
    () => issue?.issue_media?.filter((item) => item.type === "after") || [],
    [issue]
  );

  useEffect(() => {
    const loadIssue = async () => {
      setLoading(true);
      setError(null);

      const { data, error: issueError } = await supabase
        .from("issues")
        .select("id, title, description, category, address, status, priority, created_at, updated_at, created_by, issue_media(id, type, url)")
        .eq("id", issueId)
        .single();

      if (issueError) {
        setError(issueError.message);
        setLoading(false);
        return;
      }

      setIssue(data as IssueRow);

      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .select("id, issue_id, created_by, body, created_at")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });

      if (commentError) {
        setError(commentError.message);
      } else {
        setComments((commentData as Comment[]) || []);
      }

      setLoading(false);
    };

    loadIssue();
  }, [issueId]);

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentBody.trim() || !user) return;
    setCommentLoading(true);

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        issue_id: issueId,
        created_by: user.id,
        body: commentBody.trim(),
      })
      .select("id, issue_id, created_by, body, created_at")
      .single();

    if (!insertError && data) {
      setComments((prev) => [...prev, data as Comment]);
      setCommentBody("");
    }

    setCommentLoading(false);
  };

  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue) return;
    setStaffLoading(true);
    const { data, error: updateError } = await supabase
      .from("issues")
      .update({ status })
      .eq("id", issue.id)
      .select("id, status")
      .single();

    if (!updateError && data) {
      setIssue((prev) => (prev ? { ...prev, status: data.status } : prev));
    }
    setStaffLoading(false);
  };

  const handleAfterUpload = async () => {
    if (!issue || !afterFile) return;
    setStaffLoading(true);

    const fileName = `${crypto.randomUUID()}-${afterFile.name}`;
    const path = `issues/${issue.id}/after/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("issue-media")
      .upload(path, afterFile);

    if (uploadError) {
      setStaffLoading(false);
      setError(uploadError.message || "Upload failed. Please try again.");
      return;
    }

    const { data: publicUrl } = supabase.storage.from("issue-media").getPublicUrl(path);
    const url = publicUrl.publicUrl;

    const { data: mediaData, error: mediaError } = await supabase
      .from("issue_media")
      .insert({
        issue_id: issue.id,
        type: "after",
        url,
      })
      .select("id, issue_id, type, url, created_at")
      .single();

    if (mediaError) {
      setError(mediaError.message);
      setStaffLoading(false);
      return;
    }

    await supabase.from("issues").update({ status: "resolved" }).eq("id", issue.id);

    setIssue((prev) =>
      prev ? { ...prev, status: "resolved", issue_media: [...prev.issue_media, mediaData as IssueMedia] } : prev
    );
    setAfterFile(null);
    setStaffLoading(false);
  };

  const handleDeleteIssue = async () => {
    if (!issue || !user) return;
    const ok = window.confirm("Delete this issue and all comments/media? This cannot be undone.");
    if (!ok) return;
    setDeleteLoading(true);
    const { error: deleteError } = await supabase.from("issues").delete().eq("id", issue.id);
    setDeleteLoading(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    window.location.href = "/feed";
  };

  if (loading) {
    return <div className="surface-card rounded-2xl p-6 text-sm text-muted">Loading issue...</div>;
  }

  if (!issue) {
    return (
      <div className="surface-card rounded-2xl p-6 text-sm text-muted">
        {error || "Issue not found."}
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";
  const isStaff = effectiveRole === "staff" || effectiveRole === "admin";
  const isOwner = issue.created_by === user?.id;

  return (
    <section className="space-y-5">
      <div className="surface-card rounded-3xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl font-semibold">{issue.title}</h1>
            <p className="text-sm text-muted">{issue.category}</p>
            <p className="mt-1 text-sm text-muted">{issue.address}</p>
          </div>
          <StatusBadge status={issue.status} />
        </div>
        <p className="mt-4 text-sm">{issue.description}</p>
      </div>

      {isOwner || isAdmin ? (
        <button
          type="button"
          onClick={handleDeleteIssue}
          disabled={deleteLoading}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
        >
          {deleteLoading ? "Deleting..." : "Delete this issue"}
        </button>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-[var(--font-heading)] text-lg font-semibold">Before</h2>
        <ImageStrip items={beforeMedia} />
      </div>

      {afterMedia.length ? (
        <div className="space-y-3">
          <h2 className="font-[var(--font-heading)] text-lg font-semibold">After</h2>
          <ImageStrip items={afterMedia} />
        </div>
      ) : null}

      {isStaff ? (
        <div className="surface-card space-y-3 rounded-2xl p-4">
          <h3 className="font-[var(--font-heading)] text-lg font-semibold">Staff controls</h3>
          <label className="block text-sm font-medium">
            Status
            <select
              value={issue.status}
              onChange={(event) => handleStatusChange(event.target.value as IssueStatus)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Upload after photo</p>
            <label className="surface-accent flex cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:opacity-90">
              Choose after photo
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setAfterFile(event.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {afterFile ? (
              <p className="text-xs text-muted">{afterFile.name}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAfterUpload}
            disabled={staffLoading || !afterFile}
            className="w-full rounded-xl bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {staffLoading ? "Uploading..." : "Upload & mark resolved"}
          </button>
        </div>
      ) : null}

      <div className="surface-card rounded-2xl p-4">
        <h3 className="font-[var(--font-heading)] text-lg font-semibold">Comments</h3>
        <div className="mt-3 space-y-3">
          {comments.length ? (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                <p className="text-xs text-muted">
                  {comment.created_by === user?.id ? "You" : "Resident"} •{" "}
                  {new Date(comment.created_at).toLocaleString()}
                </p>
                <p className="text-sm">{comment.body}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No comments yet.</p>
          )}
        </div>
        <form onSubmit={handleAddComment} className="mt-4 space-y-2">
          <textarea
            rows={3}
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
            placeholder="Add a comment..."
          />
          <button
            type="submit"
            disabled={commentLoading}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {commentLoading ? "Posting..." : "Post comment"}
          </button>
        </form>
      </div>
    </section>
  );
}
