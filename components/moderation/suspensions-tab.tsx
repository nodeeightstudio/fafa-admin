"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActions } from "@/components/data-table/row-actions";
import { StatusBadge } from "@/components/data-table/status-badge";
import { SuspendedUser, PaginatedResponse } from "@/types/moderation";

interface SuspensionsTabProps {
  isLoading: boolean;
  suspensionData?: PaginatedResponse<SuspendedUser>;
  suspensionPage: number;
  setSuspensionPage: React.Dispatch<React.SetStateAction<number>>;
  onReinstateUser: (userId: string) => void;
}

export function SuspensionsTab({
  isLoading,
  suspensionData,
  suspensionPage,
  setSuspensionPage,
  onReinstateUser,
}: SuspensionsTabProps) {
  const suspensionColumns = useMemo(
    () => [
      {
        id: "userId",
        header: "User ID",
        cell: (user: SuspendedUser) => (
          <span className="font-mono text-xs">{user.id}</span>
        ),
      },
      {
        id: "created",
        header: "Account Created",
        cell: (user: SuspendedUser) => (
          <span className="text-sm">
            {new Date(user.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: () => <StatusBadge status="suspended" />,
      },
    ],
    []
  );

  return (
    <DataTable
      title="Suspended Users"
      description="Manage users who have been suspended from the platform."
      loading={isLoading}
      data={suspensionData?.data ?? []}
      columns={suspensionColumns}
      getRowId={(row) => row.id}
      emptyTitle="No suspended users found"
      emptyDescription="Suspended users will appear here."
      actions={(user) => (
        <RowActions
          actions={[
            {
              label: "Reinstate",
              onClick: () => onReinstateUser(user.id),
            },
          ]}
        />
      )}
      footer={
        suspensionData && suspensionData.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {suspensionData.page} of {suspensionData.totalPages} (
              {suspensionData.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspensionPage((p) => Math.max(1, p - 1))}
                disabled={suspensionPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSuspensionPage((p) =>
                    Math.min(suspensionData.totalPages, p + 1)
                  )
                }
                disabled={suspensionPage === suspensionData.totalPages}
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
