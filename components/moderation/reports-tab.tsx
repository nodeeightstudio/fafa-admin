"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActions } from "@/components/data-table/row-actions";
import { StatusBadge } from "@/components/data-table/status-badge";
import { Report, ReportStatus, PaginatedResponse } from "@/types/moderation";

interface ReportsTabProps {
  isLoading: boolean;
  reportData?: PaginatedResponse<Report>;
  reportPage: number;
  setReportPage: React.Dispatch<React.SetStateAction<number>>;
  onViewContent: (report: Report) => void;
  onUpdateStatus: (report: Report, status: ReportStatus) => void;
}

export function ReportsTab({
  isLoading,
  reportData,
  reportPage,
  setReportPage,
  onViewContent,
  onUpdateStatus,
}: ReportsTabProps) {
  const reportColumns = useMemo(
    () => [
      {
        id: "type",
        header: "Type",
        cell: (report: Report) => (
          <span className="font-semibold capitalize text-foreground">
            {report.reported_type}
          </span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: (report: Report) => (
          <span className="text-sm font-medium">{report.reason}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (report: Report) => <StatusBadge status={report.status} />,
      },
      {
        id: "actionTaken",
        header: "Action Taken",
        cell: (report: Report) => (
          <span className="text-sm text-muted-foreground">
            {report.action_taken || "-"}
          </span>
        ),
      },
      {
        id: "created",
        header: "Reported At",
        cell: (report: Report) => (
          <span className="text-sm text-muted-foreground">
            {new Date(report.created_at).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      title="Reported Content"
      description="Review and moderate reported posts, comments, and users."
      loading={isLoading}
      data={reportData?.data ?? []}
      columns={reportColumns}
      getRowId={(row) => row.id}
      emptyTitle="No reports found"
      emptyDescription="Reported content will appear here for review."
      actions={(report) => (
        <RowActions
          actions={[
            {
              label: "Review",
              onClick: () => onViewContent(report),
            },
            ...(report.status === "pending"
              ? [
                  {
                    label: "Dismiss",
                    onClick: () => onUpdateStatus(report, "dismissed"),
                  },
                ]
              : []),
          ]}
        />
      )}
      footer={
        reportData && reportData.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {reportData.page} of {reportData.totalPages} (
              {reportData.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                disabled={reportPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setReportPage((p) =>
                    Math.min(reportData.totalPages, p + 1)
                  )
                }
                disabled={reportPage === reportData.totalPages}
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
