"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getResources } from "@/lib/actions/resources";
import { getBroadcastHistory, sendBroadcast } from "@/lib/actions/broadcasts";
import { Resource } from "@/types/resource";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

interface BroadcastHistoryItem {
  id: string;
  title: string;
  message: string;
  type: string;
  resource_id: string | null;
  recipient_count: number;
  created_at: string;
}

export default function BroadcastsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [resourceId, setResourceId] = useState("none");
  const [resources, setResources] = useState<Resource[]>([]);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const [resourceData, historyData] = await Promise.all([
        getResources(),
        getBroadcastHistory(),
      ]);
      setResources(resourceData);
      setHistory(historyData);
    }

    load().catch((error) => {
      console.error("Error loading broadcast page:", error);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);

    try {
      const result = await sendBroadcast({
        title,
        message,
        resourceId: resourceId === "none" ? null : resourceId,
      });

      toast.success(`Broadcast sent to ${result.recipient_count} users.`);
      setTitle("");
      setMessage("");
      setResourceId("none");
      setHistory(await getBroadcastHistory());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Broadcasts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div>
          <h1 className="text-3xl font-bold">Broadcasts</h1>
          <p className="text-muted-foreground">
            Send inspirational messages or resource recommendations to all FAFA users.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              New Broadcast
            </CardTitle>
            <CardDescription>
              This creates in-app notifications for all active users and triggers push delivery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="A gentle reminder"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="You are doing better than you think. Take one deep breath."
                  required
                  className="min-h-28"
                />
              </div>

              <div className="space-y-2">
                <Label>Optional FAFA Resource</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No resource</SelectItem>
                    {resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If selected, tapping the push notification opens that resource in the app.
                </p>
              </div>

              <Button type="submit" disabled={sending} className="w-full md:w-auto">
                {sending ? "Sending..." : "Send Broadcast"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
            <CardDescription>Last 20 messages sent by FAFA admins.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No broadcasts sent yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {item.recipient_count} recipients
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
