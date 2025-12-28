"use client";

import { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getResources, deleteResource } from "@/lib/actions/resources";
import { Resource } from "@/types/resource";
import {
  Edit,
  Trash2,
  Video,
  FileText,
  ListMusic,
  ExternalLink,
  Music,
  Mic,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResourcesPage() {
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
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource");
    }
  };

  const getTypeIcon = (type: string) => {
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <Link href="/dashboard/resources/new">
          <Button>Add New Resource</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Directory</CardTitle>
          <CardDescription>
            Manage educational content for users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Content/URLs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : resources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No resources found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(resource.type)}
                          <span className="capitalize text-xs font-medium">
                            {resource.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{resource.title}</div>
                        {resource.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {resource.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{resource.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {resource.type === "article" ? (
                            <span className="text-xs text-muted-foreground">
                              {resource.content
                                ? "Rich text content"
                                : "Link only"}
                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 inline-flex items-center text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {resource.urls?.length || 0} URL(s)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/resources/${resource.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(resource.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
