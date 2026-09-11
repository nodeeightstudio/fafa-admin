"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActions } from "@/components/data-table/row-actions";
import { UserProfile, PaginatedResponse } from "@/types/moderation";

interface ModeratorsTabProps {
  isLoading: boolean;
  moderatorData?: PaginatedResponse<UserProfile>;
  moderatorPage: number;
  setModeratorPage: React.Dispatch<React.SetStateAction<number>>;
  onOpenInvite: () => void;
  onRevokeModerator: (userId: string) => void;
}

export function ModeratorsTab({
  isLoading,
  moderatorData,
  moderatorPage,
  setModeratorPage,
  onOpenInvite,
  onRevokeModerator,
}: ModeratorsTabProps) {
  const moderatorColumns = useMemo(
    () => [
      {
        id: "userId",
        header: "User / Profile ID",
        cell: (user: UserProfile) => (
          <span className="font-mono text-xs font-semibold">{user.id}</span>
        ),
      },
      {
        id: "name",
        header: "Full Name",
        cell: (user: UserProfile) => (
          <span className="font-medium text-sm">
            {user.full_name || user.display_name || "Community Member"}
          </span>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: () => (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" /> Active Moderator
          </span>
        ),
      },
      {
        id: "created",
        header: "Date Joined",
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Community members authorized to review reported posts and flag rule violations.
        </p>
        <Button onClick={onOpenInvite} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Moderator
        </Button>
      </div>

      <DataTable
        title="Active Moderators"
        description="Manage community moderators with flagging privileges."
        loading={isLoading}
        data={moderatorData?.data ?? []}
        columns={moderatorColumns}
        getRowId={(row) => row.id}
        emptyTitle="No moderators assigned"
        emptyDescription="Click 'Add Moderator' above to promote a user to moderator."
        actions={(user) => (
          <RowActions
            actions={[
              {
                label: "Revoke Moderator Role",
                onClick: () => onRevokeModerator(user.id),
              },
            ]}
          />
        )}
        footer={
          moderatorData && moderatorData.totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing page {moderatorData.page} of {moderatorData.totalPages} (
                {moderatorData.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModeratorPage((p) => Math.max(1, p - 1))}
                  disabled={moderatorPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setModeratorPage((p) => Math.min(moderatorData.totalPages, p + 1))
                  }
                  disabled={moderatorPage === moderatorData.totalPages}
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
