"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActions } from "@/components/data-table/row-actions";
import { UserProfile, PaginatedResponse } from "@/types/moderation";

interface EscalationsTabProps {
  isLoading: boolean;
  escalationData?: PaginatedResponse<UserProfile>;
  escalationPage: number;
  setEscalationPage: React.Dispatch<React.SetStateAction<number>>;
  onSuspendUser: (userId: string) => void;
}

export function EscalationsTab({
  isLoading,
  escalationData,
  escalationPage,
  setEscalationPage,
  onSuspendUser,
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

  return (
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
  );
}
