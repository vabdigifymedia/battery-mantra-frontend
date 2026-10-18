import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/feedback/Spinner";
import { Edit, Plus, Trash2, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pages/")({
  component: AdminPages,
});

function AdminPages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin", "cms-pages"],
    queryFn: cmsService.getAllPages,
  });

  const deleteMutation = useMutation({
    mutationFn: cmsService.deletePage,
    onSuccess: () => {
      toast.success("Page deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cms-pages"] });
    },
    onError: () => {
      toast.error("Failed to delete page");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: any }) =>
      cmsService.updatePage(pageId, data),
    onSuccess: () => {
      toast.success("Page status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "cms-pages"] });
    },
    onError: () => {
      toast.error("Failed to update page status");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (page: any) => {
    toggleMutation.mutate({
      pageId: page.pageId,
      data: {
        title: page.title,
        subTitle: page.subTitle || "",
        image1: page.image1 || "",
        image2: page.image2 || "",
        content: page.content || "",
        content2: page.content2 || "",
        isActive: !page.isActive,
        seo: page.seo || {},
      },
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">CMS Pages</h2>
          <p className="text-muted-foreground">Manage dynamic content pages like About Us, Privacy Policy.</p>
        </div>
        <Button asChild>
          <Link to="/admin/pages/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL Slug</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading pages...
                </TableCell>
              </TableRow>
            ) : !pages?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No CMS pages found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.pageId}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-muted-foreground">/{page.seo?.slug || page.pageId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {page.image1 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          <Monitor className="h-3 w-3" /> Desktop
                        </Badge>
                      )}
                      {page.image2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          <Smartphone className="h-3 w-3" /> Mobile
                        </Badge>
                      )}
                      {!page.image1 && !page.image2 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={page.isActive}
                        onCheckedChange={() => handleToggleActive(page)}
                        disabled={toggleMutation.isPending}
                        className="scale-90"
                      />
                      <Badge variant={page.isActive ? "default" : "secondary"} className="text-[10px]">
                        {page.isActive ? "Active" : "Draft"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{page.createdAt ? new Date(page.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="View live page"
                      >
                        <a
                          href={`/${page.seo?.slug || page.pageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Edit page">
                        <Link to="/admin/pages/$pageId/edit" params={{ pageId: page.pageId }}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(page.pageId)}
                        disabled={deleteMutation.isPending}
                        title="Delete page"
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
