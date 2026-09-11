"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  searchUsersForModerator,
  getEscalatedUsers,
} from "@/lib/actions/moderation";
import {
  Report,
  ReportedType,
  ReportStatus,
  UserProfile,
  ModeratedContent,
} from "@/types/moderation";
import { ReportsTab } from "@/components/moderation/reports-tab";
import { SuspensionsTab } from "@/components/moderation/suspensions-tab";
import { ModeratorsTab } from "@/components/moderation/moderators-tab";
import { EscalationsTab } from "@/components/moderation/escalations-tab";
import { ReviewContentDialog } from "@/components/moderation/review-content-dialog";
import { InviteModeratorDialog } from "@/components/moderation/invite-moderator-dialog";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [reportPage, setReportPage] = useState(1);
  const [suspensionPage, setSuspensionPage] = useState(1);
  const [moderatorPage, setModeratorPage] = useState(1);
  const [escalationPage, setEscalationPage] = useState(1);

  const [selectedContent, setSelectedContent] = useState<ModeratedContent | null>(null);
  const [isContentViewOpen, setIsContentViewOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Invite Moderator Dialog State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const searchTarget = inviteUserId.trim();
  const { data: searchMatches, isLoading: isSearchingUsers } = useSWR(
    isInviteOpen && searchTarget.length >= 2 ? ["search-users", searchTarget] : null,
    () => searchUsersForModerator(searchTarget)
  );

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

  const {
    data: escalationData,
    error: escalationError,
    isLoading: isEscalationsLoading,
    mutate: mutateEscalations,
  } = useSWR(
    activeTab === "escalations" ? [`escalations`, escalationPage] : null,
    () => getEscalatedUsers(escalationPage, 10)
  );

  const handleSuspendEscalatedUser = async (userId: string) => {
    try {
      await suspendUser("", userId);
      toast.success("Escalated user suspended.");
      mutateEscalations();
    } catch (error: unknown) {
      toast.error("Failed to suspend user: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleUpdateStatus = async (report: Report, status: ReportStatus) => {
    setIsActionLoading(true);
    try {
      await updateReportStatus(report.id, status);
      toast.success(`Report ${status}`);
      mutateReports();
      setIsContentViewOpen(false);
    } catch (error: unknown) {
      toast.error("Failed to update status: " + (error instanceof Error ? error.message : String(error)));
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
    } catch (err) {
      console.error(err);
      setSelectedContent(null);
    }
    setIsContentViewOpen(true);
  };

  const handleDeleteContent = async () => {
    if (!currentReport || !selectedContent) return;
    setIsActionLoading(true);
    try {
      await deleteReportedContent(
        currentReport.id,
        currentReport.reported_type,
        currentReport.reported_id
      );
      toast.success("Content marked as deleted and report resolved.");
      mutateReports();
      setIsContentViewOpen(false);
    } catch (error: unknown) {
      toast.error("Failed to delete content: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!currentReport || !selectedContent) return;
    const authorId = selectedContent.user_id || selectedContent.author_id;
    if (!authorId) {
      toast.error("Author ID not found for this content");
      return;
    }

    setIsActionLoading(true);
    try {
      await suspendUser(currentReport.id, authorId);
      toast.success("User suspended successfully.");
      mutateReports();
      setIsContentViewOpen(false);
    } catch (error: unknown) {
      toast.error("Failed to suspend user: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReinstate = async (userId: string) => {
    try {
      await reinstateUser(userId);
      toast.success("User reinstated successfully.");
      mutateSuspensions();
    } catch (error: unknown) {
      toast.error("Failed to reinstate user: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleRevokeModerator = async (userId: string) => {
    try {
      await revokeModerator(userId);
      toast.success("Moderator role revoked.");
      mutateModerators();
    } catch (error: unknown) {
      toast.error("Failed to revoke moderator: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleInviteModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;

    setIsInviting(true);
    try {
      await adminInviteModerator(inviteUserId.trim());
      toast.success("Moderator privileges granted successfully!");
      setIsInviteOpen(false);
      setInviteUserId("");
      setSelectedUser(null);
      mutateModerators();
    } catch (error: unknown) {
      toast.error("Failed to invite moderator: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsInviting(false);
    }
  };

  if (reportError || suspensionError || moderatorError) {
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
            Review reported content, manage suspended users, and assign community moderators.
          </p>
        </div>
        <Button
          onClick={() => {
            if (activeTab === "reports") mutateReports();
            else if (activeTab === "suspensions") mutateSuspensions();
            else mutateModerators();
          }}
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
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
          <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab
            isLoading={isReportsLoading}
            reportData={reportData}
            reportPage={reportPage}
            setReportPage={setReportPage}
            onViewContent={handleViewContent}
            onUpdateStatus={(report, status) => handleUpdateStatus(report, status)}
          />
        </TabsContent>

        <TabsContent value="escalations" className="space-y-4">
          <EscalationsTab
            isLoading={isEscalationsLoading}
            escalationData={escalationData}
            escalationPage={escalationPage}
            setEscalationPage={setEscalationPage}
            onSuspendUser={handleSuspendEscalatedUser}
          />
        </TabsContent>

        <TabsContent value="suspensions" className="space-y-4">
          <SuspensionsTab
            isLoading={isSuspensionsLoading}
            suspensionData={suspensionData}
            suspensionPage={suspensionPage}
            setSuspensionPage={setSuspensionPage}
            onReinstateUser={handleReinstate}
          />
        </TabsContent>

        <TabsContent value="moderators" className="space-y-4">
          <ModeratorsTab
            isLoading={isModeratorsLoading}
            moderatorData={moderatorData}
            moderatorPage={moderatorPage}
            setModeratorPage={setModeratorPage}
            onOpenInvite={() => setIsInviteOpen(true)}
            onRevokeModerator={handleRevokeModerator}
          />
        </TabsContent>
      </Tabs>

      <ReviewContentDialog
        isOpen={isContentViewOpen}
        onOpenChange={setIsContentViewOpen}
        report={currentReport}
        selectedContent={selectedContent}
        isActionLoading={isActionLoading}
        onDeleteContent={handleDeleteContent}
        onSuspendUser={handleSuspendUser}
        onUpdateStatus={(status) => handleUpdateStatus(currentReport!, status)}
      />

      <InviteModeratorDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        inviteUserId={inviteUserId}
        setInviteUserId={setInviteUserId}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        searchTarget={searchTarget}
        searchMatches={searchMatches}
        isSearchingUsers={isSearchingUsers}
        isInviting={isInviting}
        onInviteModerator={handleInviteModerator}
      />
    </div>
  );
}
