"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActions } from "@/components/data-table/row-actions";
import { Report, UserProfile, PaginatedResponse } from "@/types/moderation";

export interface EscalatedReport extends Report {
  content?: string;
}

interface EscalationsTabProps {
  isLoading: boolean;
  escalationData?: PaginatedResponse<UserProfile>;
  escalationPage: number;
  setEscalationPage: React.Dispatch<React.SetStateAction<number>>;
  onSuspendUser: (userId: string) => void;
  postsLoading?: boolean;
  escalatedPosts?: PaginatedResponse<EscalatedReport>;
  postsPage: number;
  setPostsPage: React.Dispatch<React.SetStateAction<number>>;
  onViewPost?: (report: EscalatedReport) => void;
}

export function EscalationsTab({
  isLoading,
  escalationData,
  escalationPage,
  setEscalationPage,
  onSuspendUser,
  postsLoading,
  escalatedPosts,
  postsPage,
  setPostsPage,
  onViewPost,
}: EscalationsTabProps) {
  const escalationColumns = useMemo(
    () => [
      {
        id: "userId",
        header: "User ID",
        cell: (user: UserProfile) => (
          <span className="font-mono text-xs font-semibold">{user.id}</span>
        ),
      },
      {
        id: "name",
        header: "Name / Display",
        cell: (user: UserProfile) => (
          <span className="font-medium text-sm">
            {user.full_name || user.display_name || user.email || "Anonymous User"}
          </span>
        ),
      },
      {
        id: "deletedCount",
        header: "Deleted Posts",
        cell: (user: UserProfile) => (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            {user.deleted_posts_count || 0} Deletions
          </span>
        ),
      },
      {
        id: "created",
        header: "Account Created",
        cell: (user: UserProfile) => (
          <span className="text-sm text-muted-foreground">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
          </span>
        ),
      },
    ],
    []
  );

  const postColumns = useMemo(
    () => [
      {
        id: "type",
        header: "Type",
        cell: (report: EscalatedReport) => (
          <span className="font-semibold capitalize">{report.reported_type}</span>
        ),
      },
      {
        id: "content",
        header: "Post",
        cell: (report: EscalatedReport) => (
          <span className="line-clamp-2 text-sm">
            {report.content || report.reason || "Escalated content"}
          </span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: (report: EscalatedReport) => (
          <span className="text-sm text-muted-foreground">{report.reason}</span>
        ),
      },
      {
        id: "created",
        header: "Escalated",
        cell: (report: EscalatedReport) => (
          <span className="text-sm text-muted-foreground">
            {report.created_at ? new Date(report.created_at).toLocaleDateString() : "N/A"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
    <DataTable
      title="Escalated posts"
      description="Posts and reports moderators escalated for super-admin review."
      loading={postsLoading}
      data={escalatedPosts?.data ?? []}
      columns={postColumns}
      getRowId={(row) => row.id}
      emptyTitle="No escalated posts"
      emptyDescription="When a moderator escalates a post, it shows up here."
      actions={
        onViewPost
          ? (report) => (
              <RowActions
                actions={[
                  {
                    label: "View",
                    onClick: () => onViewPost(report),
                  },
                ]}
              />
            )
          : undefined
      }
      footer={
        escalatedPosts && escalatedPosts.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {escalatedPosts.page} of {escalatedPosts.totalPages} (
              {escalatedPosts.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={postsPage === 1}
                onClick={() => setPostsPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={postsPage === escalatedPosts.totalPages}
                onClick={() =>
                  setPostsPage((page) =>
                    Math.min(escalatedPosts.totalPages, page + 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null
      }
    />
    <DataTable
      title="Escalated for Suspension"
      description="Users flagged by moderator consensus (> 3 deleted posts) requiring admin review for suspension."
      loading={isLoading}
      data={escalationData?.data ?? []}
      columns={escalationColumns}
      getRowId={(row) => row.id}
      emptyTitle="No escalated users"
      emptyDescription="Users flagged by multiple moderators for repeated violations will appear here."
      actions={(user) => (
        <RowActions
          actions={[
            {
              label: "Suspend User",
              onClick: () => onSuspendUser(user.id),
            },
          ]}
        />
      )}
      footer={
        escalationData && escalationData.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {escalationData.page} of {escalationData.totalPages} (
              {escalationData.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEscalationPage((p) => Math.max(1, p - 1))}
                disabled={escalationPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEscalationPage((p) =>
                    Math.min(escalationData.totalPages, p + 1)
                  )
                }
                disabled={escalationPage === escalationData.totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null
      }
    />
    </div>
  );
}
