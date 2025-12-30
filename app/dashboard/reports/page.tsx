"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getReports,
  getReportedContent,
  updateReportStatus,
  deleteReportedContent,
  suspendUser,
  getSuspendedUsers,
  reinstateUser,
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
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ModerationSkeleton } from "@/components/moderation/moderation-skeleton";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [reportPage, setReportPage] = useState(1);
  const [suspensionPage, setSuspensionPage] = useState(1);

  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isContentViewOpen, setIsContentViewOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // SWR for Reports
  const {
    data: reportData,
    error: reportError,
    isLoading: isReportsLoading,
    mutate: mutateReports,
  } = useSWR(activeTab === "reports" ? [`reports`, reportPage] : null, () =>
    getReports(undefined, reportPage, 10)
  );

  // SWR for Suspensions
  const {
    data: suspensionData,
    error: suspensionError,
    isLoading: isSuspensionsLoading,
    mutate: mutateSuspensions,
  } = useSWR(
    activeTab === "suspensions" ? [`suspensions`, suspensionPage] : null,
    () => getSuspendedUsers(suspensionPage, 10)
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

  if (reportError || suspensionError) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading moderation data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <Button
          onClick={() =>
            activeTab === "reports" ? mutateReports() : mutateSuspensions()
          }
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {isReportsLoading ? (
            <ModerationSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reported Content</CardTitle>
                <CardDescription>
                  Review and moderate reported posts, comments, and users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.data.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No reports found
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData?.data.map((report: Report) => (
                        <TableRow key={report.id}>
                          <TableCell className="capitalize font-medium">
                            {report.reported_type}
                          </TableCell>
                          <TableCell>{report.reason}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                report.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : report.status === "reviewed"
                                  ? "bg-blue-100 text-blue-800"
                                  : report.status === "resolved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {report.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewContent(report)}
                              >
                                Review
                              </Button>
                              {report.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(report, "dismissed")
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  Dismiss
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {reportData && reportData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing page {reportData.page} of {reportData.totalPages}{" "}
                      ({reportData.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                        disabled={reportPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
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
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suspensions" className="space-y-4">
          {isSuspensionsLoading ? (
            <ModerationSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Suspended Users</CardTitle>
                <CardDescription>
                  Manage users who have been suspended from the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Account Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspensionData?.data.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No suspended users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      suspensionData?.data.map((u: SuspendedUser) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-xs">
                            {u.id}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Suspended
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReinstate(u.id)}
                              className="gap-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              Reinstate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {suspensionData && suspensionData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
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
                        <ChevronLeft className="w-4 h-4 mr-1" />
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
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Content Review Modal */}
      <Dialog open={isContentViewOpen} onOpenChange={setIsContentViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Review Reported {currentReport?.reported_type}
            </DialogTitle>
            <DialogDescription>
              Reason:{" "}
              <span className="font-semibold text-foreground">
                {currentReport?.reason}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
                Author ID:{" "}
                {selectedContent.user_id || selectedContent.author_id}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between flex-wrap gap-2">
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
                <Trash2 className="w-4 h-4" />
                Delete Post
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSuspendUser}
                disabled={!selectedContent || isActionLoading}
                className="gap-1"
              >
                <UserX className="w-4 h-4" />
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
                <XCircle className="w-4 h-4" />
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(currentReport!, "resolved")}
                disabled={isActionLoading}
                className="gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Resolve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
