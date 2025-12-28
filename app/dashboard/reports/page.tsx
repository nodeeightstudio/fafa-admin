"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
import {
  getReports,
  getReportedContent,
  updateReportStatus,
  deleteReportedContent,
  suspendUser,
} from "@/lib/actions/moderation";
import { Report, ReportedType } from "@/types/moderation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, Trash2, UserX, CheckCircle, XCircle } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isContentViewOpen, setIsContentViewOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch reports: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (report: Report, status: any) => {
    try {
      await updateReportStatus(report.id, status);
      toast.success(`Report ${status}`);
      fetchReports();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
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

    try {
      await deleteReportedContent(
        currentReport.id,
        currentReport.reported_type as ReportedType,
        currentReport.reported_id
      );
      toast.success("Content deleted and report resolved");
      setIsContentViewOpen(false);
      fetchReports();
    } catch (error: any) {
      toast.error("Failed to delete content: " + error.message);
    }
  };

  const handleSuspendUser = async () => {
    if (!currentReport || !selectedContent) return;

    const authorId = selectedContent.user_id || selectedContent.author_id;
    if (!authorId) {
      toast.error("Could not identify the author");
      return;
    }

    try {
      await suspendUser(currentReport.id, authorId);
      toast.success("User suspended and report resolved");
      setIsContentViewOpen(false);
      fetchReports();
    } catch (error: any) {
      toast.error("Failed to suspend user: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <Button onClick={fetchReports} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
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
                    <TableCell>
                      <div className="flex gap-2">
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
        </CardContent>
      </Card>

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
                disabled={!selectedContent || selectedContent.is_deleted}
                className="gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete Post
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSuspendUser}
                disabled={!selectedContent}
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
                className="gap-1"
              >
                <XCircle className="w-4 h-4" />
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(currentReport!, "resolved")}
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
