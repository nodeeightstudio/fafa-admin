"use client";

import { AlertCircle, CheckCircle, Trash2, UserX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Report, ReportStatus, ModeratedContent } from "@/types/moderation";

interface ReviewContentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  selectedContent: ModeratedContent | null;
  isActionLoading: boolean;
  onDeleteContent: () => void;
  onSuspendUser: () => void;
  onUpdateStatus: (status: ReportStatus) => void;
}

export function ReviewContentDialog({
  isOpen,
  onOpenChange,
  report,
  selectedContent,
  isActionLoading,
  onDeleteContent,
  onSuspendUser,
  onUpdateStatus,
}: ReviewContentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Review Reported {report?.reported_type}
          </DialogTitle>
          <DialogDescription>
            Reason:{" "}
            <span className="font-semibold text-foreground">
              {report?.reason}
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
              onClick={onDeleteContent}
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
              onClick={onSuspendUser}
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
              onClick={() => onUpdateStatus("dismissed")}
              disabled={isActionLoading}
              className="gap-1"
            >
              <XCircle className="h-4 w-4" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdateStatus("resolved")}
              disabled={isActionLoading}
              className="gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Resolve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
