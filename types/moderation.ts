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
  text?: string;
  content?: string;
  user_id?: string;
  author_id?: string;
  is_deleted?: boolean;
  created_at?: string;
}

export interface SuspendedUser {
  id: string;
  created_at: string;
  is_active: boolean;
  avatar_number?: number;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  is_moderator?: boolean;
  is_active?: boolean;
  created_at?: string;
  deleted_posts_count?: number;
  escalated_for_suspension?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
