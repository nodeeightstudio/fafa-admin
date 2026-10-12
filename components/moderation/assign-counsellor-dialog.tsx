"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCounsellors } from "@/lib/actions/counsellors";
import { Counsellor } from "@/types/counsellor";

interface AssignCounsellorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (counsellorId: string) => Promise<void>;
}

export function AssignCounsellorDialog({
  isOpen,
  onOpenChange,
  onAssign,
}: AssignCounsellorDialogProps) {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [counsellorId, setCounsellorId] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingList(true);
    getCounsellors({ status: "active" })
      .then((rows) => {
        if (!cancelled) setCounsellors(rows);
      })
      .catch(() => {
        if (!cancelled) setCounsellors([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!counsellorId) return;
    setSaving(true);
    try {
      await onAssign(counsellorId);
      setCounsellorId("");
      onOpenChange(false);
    } catch {
      // The parent reports the error and leaves this dialog open.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign counsellor</DialogTitle>
            <DialogDescription>
              Send this reported person to a counsellor. They will see the assignment on their dashboard and can open a chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="assigned-counsellor">Counsellor</Label>
            <select
              id="assigned-counsellor"
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={counsellorId}
              onChange={(event) => setCounsellorId(event.target.value)}
              disabled={loadingList || saving}
            >
              <option value="">
                {loadingList ? "Loading counsellors..." : "Select a counsellor"}
              </option>
              {counsellors.map((counsellor) => (
                <option key={counsellor.id} value={counsellor.id}>
                  {counsellor.name}
                  {counsellor.tier ? ` · Tier ${counsellor.tier}` : ""}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!counsellorId || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
