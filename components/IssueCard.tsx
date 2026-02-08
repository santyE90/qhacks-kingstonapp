import Link from "next/link";
import type { Issue, IssueMedia } from "@/lib/types";
import StatusBadge from "./StatusBadge";

type Props = {
  issue: Issue;
  cover?: IssueMedia | null;
};

export default function IssueCard({ issue, cover }: Props) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="surface-card block rounded-2xl p-4 transition hover:-translate-y-0.5"
    >
      <div className="card-accent-bar mb-3" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-[var(--font-heading)] text-lg font-semibold">{issue.title}</h3>
          <p className="text-sm text-muted">{issue.category}</p>
        </div>
        <StatusBadge status={issue.status} />
      </div>
      <p className="mt-2 text-sm text-muted">{issue.address}</p>
      {cover ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
          <img src={cover.url} alt="Issue" className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <p className="mt-3 text-sm">{issue.description}</p>
    </Link>
  );
}
