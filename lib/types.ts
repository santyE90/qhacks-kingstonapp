export type Role = "citizen" | "staff" | "admin";

export type IssueStatus = "open" | "in_progress" | "resolved";

export type IssueMediaType = "before" | "after";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export type Issue = {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: string;
  address: string;
  status: IssueStatus;
  latitude: number | null;
  longitude: number | null;
  priority: number | null;
  created_at: string;
  updated_at: string;
  issue_media?: IssueMedia[];
};

export type IssueMedia = {
  id: string;
  issue_id: string;
  type: IssueMediaType;
  url: string;
  created_at: string;
};

export type Comment = {
  id: string;
  issue_id: string;
  created_by: string;
  body: string;
  created_at: string;
};

export type UpdatePost = {
  id: string;
  created_by: string;
  title: string;
  body: string;
  created_at: string;
};
