"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getResources, deleteResource } from "@/lib/actions/resources";
import { Resource } from "@/types/resource";
import {
  ExternalLink,
  FileText,
  ListMusic,
  Mic,
  Music,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { RowActions } from "@/components/data-table/row-actions";
import { toast } from "sonner";

function getTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />;
    case "article":
      return <FileText className="h-4 w-4" />;
    case "playlist":
      return <ListMusic className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "podcast":
      return <Mic className="h-4 w-4" />;
    default:
      return null;
  }
}

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchResources();
  }, [typeFilter]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getResources({
        type: typeFilter === "all" ? undefined : typeFilter,
        search: searchTerm || undefined,
      });
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      await deleteResource(id);
      setResources(resources.filter((r) => r.id !== id));
      toast.success("Resource deleted");
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "type",
        header: "Type",
        cell: (resource: Resource) => (
          <div className="flex items-center gap-2">
            {getTypeIcon(resource.type)}
            <span className="text-xs font-medium capitalize">{resource.type}</span>
          </div>
        ),
      },
      {
        id: "title",
        header: "Title",
        cell: (resource: Resource) => (
          <div className="min-w-[220px]">
            <p className="font-medium">{resource.title}</p>
            {resource.description && (
              <p className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground">
                {resource.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (resource: Resource) => (
          <Badge variant="secondary">{resource.category}</Badge>
        ),
      },
      {
        id: "scope",
        header: "Scope",
        cell: (resource: Resource) => (
          <Badge variant="outline" className="capitalize">
            {resource.scope}
          </Badge>
        ),
      },
      {
        id: "content",
        header: "Content",
        cell: (resource: Resource) => (
          <div className="text-xs text-muted-foreground">
            {resource.type === "article" ? (
              <span className="inline-flex items-center gap-1">
                {resource.content ? "Rich text" : "Link only"}
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </span>
            ) : (
              <span>{resource.urls?.length || 0} URL(s)</span>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">Manage educational content for users</p>
        </div>
        <Link href="/dashboard/resources/new">
          <Button>Add New Resource</Button>
        </Link>
      </div>

      <DataTable
        title="Resource Directory"
        description="Browse, filter, and manage all published resources."
        loading={loading}
        data={resources}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle="No resources found"
        emptyDescription="Try adjusting your filters or create a new resource."
        emptyAction={
          <Link href="/dashboard/resources/new">
            <Button variant="outline" size="sm">
              Add resource
            </Button>
          </Link>
        }
        toolbar={
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchResources()}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="playlist">Playlists</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchResources}>
              Search
            </Button>
          </div>
        }
        actions={(resource) => (
          <RowActions
            actions={[
              {
                label: "Edit",
                onClick: () => router.push(`/dashboard/resources/${resource.id}`),
              },
              {
                label: "Delete",
                destructive: true,
                separator: true,
                onClick: () => handleDelete(resource.id),
              },
            ]}
          />
        )}
      />
    </div>
  );
}
