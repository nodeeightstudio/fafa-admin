export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type ReportedType = "post" | "comment" | "user";

export interface Report {
  id: string;
  reporter_id: string;
  reported_type: ReportedType;
  reported_id: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  created_at: string;
  action_taken?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface ModeratedContent {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  author_id: string;
  author_name?: string;
}

export interface SuspendedUser {
  id: string;
  created_at: string;
  is_active: boolean;
  avatar_number: number;
  email?: string;
}
