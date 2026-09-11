import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getReports,
  getReportedContent,
  updateReportStatus,
  deleteReportedContent,
  suspendUser,
  getSuspendedUsers,
  reinstateUser,
  getModerators,
  adminInviteModerator,
  revokeModerator,
} from "@/lib/actions/moderation";
import { Report, ReportedType, SuspendedUser } from "@/types/moderation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertCircle,
  Trash2,
  UserX,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { StatusBadge } from "@/components/data-table/status-badge";
import { RowActions } from "@/components/data-table/row-actions";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [reportPage, setReportPage] = useState(1);
  const [suspensionPage, setSuspensionPage] = useState(1);
  const [moderatorPage, setModeratorPage] = useState(1);

  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isContentViewOpen, setIsContentViewOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Invite Moderator Dialog State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const {
    data: reportData,
    error: reportError,
    isLoading: isReportsLoading,
    mutate: mutateReports,
  } = useSWR(activeTab === "reports" ? [`reports`, reportPage] : null, () =>
    getReports(undefined, reportPage, 10)
  );

  const {
    data: suspensionData,
    error: suspensionError,
    isLoading: isSuspensionsLoading,
    mutate: mutateSuspensions,
  } = useSWR(
    activeTab === "suspensions" ? [`suspensions`, suspensionPage] : null,
    () => getSuspendedUsers(suspensionPage, 10)
  );

  const {
    data: moderatorData,
    error: moderatorError,
    isLoading: isModeratorsLoading,
    mutate: mutateModerators,
  } = useSWR(
    activeTab === "moderators" ? [`moderators`, moderatorPage] : null,
    () => getModerators(moderatorPage, 10)
  );

  const handleUpdateStatus = async (report: Report, status: any) => {
    setIsActionLoading(true);
    try {
      await updateReportStatus(report.id, status);
      toast.success(`Report ${status}`);
      mutateReports();
      setIsContentViewOpen(false);
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewContent = async (report: Report) => {
    setCurrentReport(report);
    try {
      const content = await getReportedContent(
        report.reported_type as ReportedType,
        report.reported_id
      );
      setSelectedContent(content);
      setIsContentViewOpen(true);
    } catch (error: any) {
      toast.error("Failed to fetch content: " + error.message);
    }
  };

  const handleDeleteContent = async () => {
    if (!currentReport || !selectedContent) return;
    setIsActionLoading(true);
    try {
      await deleteReportedContent(
        currentReport.id,
        currentReport.reported_type as ReportedType,
        currentReport.reported_id
      );
      toast.success("Content deleted and report resolved");
      setIsContentViewOpen(false);
      mutateReports();
    } catch (error: any) {
      toast.error("Failed to delete content: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!currentReport || !selectedContent) return;
    const authorId = selectedContent.user_id || selectedContent.author_id;
    if (!authorId) {
      toast.error("Could not identify the author");
      return;
    }

    setIsActionLoading(true);
    try {
      await suspendUser(currentReport.id, authorId);
      toast.success("User suspended and report resolved");
      setIsContentViewOpen(false);
      mutateReports();
      if (activeTab === "suspensions") mutateSuspensions();
    } catch (error: any) {
      toast.error("Failed to suspend user: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReinstate = async (userId: string) => {
    try {
      await reinstateUser(userId);
      toast.success("User reinstated successfully");
      mutateSuspensions();
    } catch (error: any) {
      toast.error("Failed to reinstate user: " + error.message);
    }
  };

  const handleInviteModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim()) {
      toast.error("Please enter a valid User ID");
      return;
    }

    setIsInviting(true);
    try {
      await adminInviteModerator(inviteUserId.trim());
      toast.success("User promoted to Moderator successfully!");
      setInviteUserId("");
      setIsInviteOpen(false);
      mutateModerators();
    } catch (error: any) {
      toast.error("Failed to invite moderator: " + error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeModerator = async (userId: string) => {
    try {
      await revokeModerator(userId);
      toast.success("Moderator role revoked");
      mutateModerators();
    } catch (error: any) {
      toast.error("Failed to revoke moderator role: " + error.message);
    }
  };

  const reportColumns = useMemo(
    () => [
      {
        id: "type",
        header: "Type",
        cell: (report: Report) => (
          <span className="font-medium capitalize">{report.reported_type}</span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: (report: Report) => (
          <span className="max-w-[320px] truncate">{report.reason}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (report: Report) => <StatusBadge status={report.status} />,
      },
      {
        id: "date",
        header: "Date",
        cell: (report: Report) => (
          <span className="text-sm text-muted-foreground">
            {new Date(report.created_at).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

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
  const moderatorColumns = useMemo(
    () => [
      {
        id: "userId",
        header: "User / Profile ID",
        cell: (user: any) => (
          <span className="font-mono text-xs font-semibold">{user.id}</span>
        ),
      },
      {
        id: "name",
        header: "Full Name",
        cell: (user: any) => (
          <span className="font-medium text-sm">{user.full_name || user.display_name || "Community Member"}</span>
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
        cell: (user: any) => (
          <span className="text-sm text-muted-foreground">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
          </span>
        ),
      },
    ],
    []
  );

  if (reportError || suspensionError) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading moderation data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review reported content and manage suspended users
          </p>
        </div>
        <Button
          onClick={() =>
            activeTab === "reports" ? mutateReports() : mutateSuspensions()
          }
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <DataTable
            title="Reported Content"
            description="Review and moderate reported posts, comments, and users."
            loading={isReportsLoading}
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
                    onClick: () => handleViewContent(report),
                  },
                  ...(report.status === "pending"
                    ? [
                        {
                          label: "Dismiss",
                          onClick: () => handleUpdateStatus(report, "dismissed"),
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
        </TabsContent>

        <TabsContent value="suspensions" className="space-y-4">
          <DataTable
            title="Suspended Users"
            description="Manage users who have been suspended from the platform."
            loading={isSuspensionsLoading}
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
                    onClick: () => handleReinstate(user.id),
                  },
                ]}
              />
            )}
            footer={
              suspensionData && suspensionData.totalPages > 1 ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing page {suspensionData.page} of{" "}
                    {suspensionData.totalPages} ({suspensionData.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSuspensionPage((p) => Math.max(1, p - 1))
                      }
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
        <TabsContent value="moderators" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Community members authorized to review reported posts and flag rule violations.
            </p>
            <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Moderator
            </Button>
          </div>

          <DataTable
            title="Active Moderators"
            description="Manage community moderators with flagging privileges."
            loading={isModeratorsLoading}
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
                    onClick: () => handleRevokeModerator(user.id),
                  },
                ]}
              />
            )}
            footer={
              moderatorData && moderatorData.totalPages > 1 ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing page {moderatorData.page} of{" "}
                    {moderatorData.totalPages} ({moderatorData.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setModeratorPage((p) => Math.max(1, p - 1))
                      }
                      disabled={moderatorPage === 1}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setModeratorPage((p) =>
                          Math.min(moderatorData.totalPages, p + 1)
                        )
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
        </TabsContent>
      </Tabs>

      <Dialog open={isContentViewOpen} onOpenChange={setIsContentViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Review Reported {currentReport?.reported_type}
            </DialogTitle>
            <DialogDescription>
              Reason:{" "}
              <span className="font-semibold text-foreground">
                {currentReport?.reason}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {selectedContent ? (
                  selectedContent.text ||
                  selectedContent.content ||
                  "No text content available"
                ) : (
                  <span className="italic text-muted-foreground">
                    Content not found or already deleted
                  </span>
                )}
              </p>
            </div>
            {selectedContent && (
              <div className="text-xs text-muted-foreground">
                Author ID: {selectedContent.user_id || selectedContent.author_id}
              </div>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteContent}
                disabled={
                  !selectedContent ||
                  selectedContent.is_deleted ||
                  isActionLoading
                }
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete Post
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSuspendUser}
                disabled={!selectedContent || isActionLoading}
                className="gap-1"
              >
                <UserX className="h-4 w-4" />
                Suspend Author
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(currentReport!, "dismissed")}
                disabled={isActionLoading}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(currentReport!, "resolved")}
                disabled={isActionLoading}
                className="gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Resolve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      {/* Invite/Promote Moderator Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleInviteModerator}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Add Community Moderator
              </DialogTitle>
              <DialogDescription>
                Search for a community member by email address or User ID to promote them to moderator.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User Email Address or ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="e.g. user@example.com or User UUID"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? "Promoting..." : "Promote to Moderator"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
