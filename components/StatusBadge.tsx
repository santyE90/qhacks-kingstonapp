import type { IssueStatus } from "@/lib/types";

const labels: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

const styles: Record<IssueStatus, string> = {
  open: "status-pill badge-open",
  in_progress: "status-pill badge-progress",
  resolved: "status-pill badge-resolved",
};

export default function StatusBadge({ status }: { status: IssueStatus }) {
  return <span className={styles[status]}>{labels[status]}</span>;
}
