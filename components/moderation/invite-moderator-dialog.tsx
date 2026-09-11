"use client";

import { Loader2, Search, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/moderation";

interface InviteModeratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inviteUserId: string;
  setInviteUserId: (value: string) => void;
  selectedUser: UserProfile | null;
  setSelectedUser: (user: UserProfile | null) => void;
  searchTarget: string;
  searchMatches?: UserProfile[];
  isSearchingUsers: boolean;
  isInviting: boolean;
  onInviteModerator: (e: React.FormEvent) => void;
}

export function InviteModeratorDialog({
  isOpen,
  onOpenChange,
  inviteUserId,
  setInviteUserId,
  selectedUser,
  setSelectedUser,
  searchTarget,
  searchMatches,
  isSearchingUsers,
  isInviting,
  onInviteModerator,
}: InviteModeratorDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setInviteUserId("");
          setSelectedUser(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={onInviteModerator}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Community Moderator
            </DialogTitle>
            <DialogDescription>
              Search for a community member by email, name, or User ID to grant moderation privileges.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="userId">Search Member by Name, Email, or ID</Label>
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userId"
                  type="text"
                  placeholder="Type name or email (e.g. kofi@example.com)..."
                  value={inviteUserId}
                  onChange={(e) => {
                    setInviteUserId(e.target.value);
                    if (
                      selectedUser &&
                      selectedUser.email !== e.target.value &&
                      selectedUser.id !== e.target.value
                    ) {
                      setSelectedUser(null);
                    }
                  }}
                  className="pl-9"
                  required
                />
                {isSearchingUsers && (
                  <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* LIVE SEARCH MATCHES DROPDOWN */}
              {searchTarget.length >= 2 && !selectedUser && (
                <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
                  {isSearchingUsers ? (
                    <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching members...
                    </div>
                  ) : searchMatches && searchMatches.length > 0 ? (
                    searchMatches.map((user: UserProfile) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setInviteUserId(user.email || user.id);
                          setSelectedUser(user);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(user.full_name || user.display_name || user.email || "U")[0].toUpperCase()}
                          </div>
                          <div className="grid text-left text-xs">
                            <span className="font-semibold text-foreground truncate">
                              {user.full_name || user.display_name || "Community Member"}
                            </span>
                            <span className="text-muted-foreground truncate">
                              {user.email || user.id}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Select
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No eligible users found matching &quot;{searchTarget}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* SELECTED USER CARD */}
              {selectedUser && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    <div className="grid text-xs">
                      <span className="font-bold text-foreground">
                        {selectedUser.full_name || selectedUser.display_name || "Selected Member"}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {selectedUser.email || selectedUser.id}
                      </span>
                    </div>
                  </div>
                  {selectedUser.is_moderator ? (
                    <span className="text-xs font-bold text-amber-600">Already Moderator</span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">Selected</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setInviteUserId("");
                setSelectedUser(null);
              }}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isInviting || Boolean(selectedUser && selectedUser.is_moderator)}
            >
              {isInviting ? "Promoting..." : "Promote to Moderator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
