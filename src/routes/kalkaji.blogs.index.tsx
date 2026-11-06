import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminBlogsListQuery } from "@/queries";
import { blogsService } from "@/services/blogs.service";
import type { BlogStatus, BlogPostListResponse } from "@/types/dto";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Spinner";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  BookOpen,
  Eye,
  CheckCircle2,
  FileEdit,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/kalkaji/blogs/")({
  component: AdminBlogsList,
});

function AdminBlogsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const queryParams = {
    search: search.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : (statusFilter as BlogStatus),
    page: 0,
    size: 50,
  };

  const { data: blogsData, isLoading } = useQuery(adminBlogsListQuery(queryParams));
  const posts: BlogPostListResponse[] = blogsData?.content || [];

  // Metrics calculation
  const totalPosts = blogsData?.totalElements ?? posts.length;
  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = posts.filter((p) => p.status === "DRAFT").length;
  const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogsService.delete(id),
    onSuccess: () => {
      toast.success("Blog post deleted");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete blog post"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogStatus }) =>
      blogsService.updateStatus(id, status),
    onSuccess: (updated) => {
      toast.success(`Post status updated to ${updated.status}`);
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update status"),
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: BlogStatus) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Published
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <FileEdit className="mr-1 h-3 w-3" /> Draft
          </Badge>
        );
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Blog Articles</h2>
          <p className="text-muted-foreground">
            Publish educational guides, maintenance tips, and SEO articles to drive organic traffic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/kalkaji/blogs/new">
              <Plus className="mr-2 h-4 w-4" /> Add Blog Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Articles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published Live</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{publishedCount}</div>
            <p className="text-xs text-muted-foreground">Accessible by public & search engines</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts In Progress</CardTitle>
            <FileEdit className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Not yet visible to users</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Cumulative reader impressions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, excerpt or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published Only</SelectItem>
            <SelectItem value="DRAFT">Drafts Only</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[320px]">Article</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Spinner size="md" />
                    <span className="text-sm text-muted-foreground">Loading blog articles...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium">No blog posts found</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Get started by writing an informative guide or battery maintenance article.
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/kalkaji/blogs/new">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First Post
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  {/* Article Title & Cover */}
                  <TableCell>
                    <div className="flex items-start gap-3">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-12 w-16 shrink-0 rounded object-cover border"
                        />
                      ) : (
                        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground">
                          <BookOpen className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm line-clamp-1">{post.title}</span>
                          {post.isFeatured && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                              <Sparkles className="mr-0.5 h-2.5 w-2.5" /> Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 font-mono">
                          /blog/{post.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">
                      {post.category}
                    </Badge>
                  </TableCell>

                  {/* Author */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {post.authorName || "Battery Mantra"}
                    </span>
                  </TableCell>

                  {/* Status Dropdown */}
                  <TableCell>
                    <Select
                      value={post.status}
                      onValueChange={(val: BlogStatus) =>
                        statusMutation.mutate({ id: post.id, status: val })
                      }
                    >
                      <SelectTrigger className="h-8 w-[125px] border-none bg-transparent p-0 shadow-none hover:bg-muted/50 rounded px-1.5">
                        {getStatusBadge(post.status)}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Views & Read Time */}
                  <TableCell>
                    <div className="text-xs space-y-0.5 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {post.viewCount || 0} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTimeMinutes || 3} min read
                      </div>
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : new Date(post.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "PUBLISHED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="View on live website"
                        >
                          <a
                            href={`/blog/${(post.slug || "").replace(/\{city_name\}|\{city\}|city-name/g, "delhi")}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Edit article"
                      >
                        <Link to="/kalkaji/blogs/$id/edit" params={{ id: post.id }}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id, post.title)}
                        title="Delete article"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

