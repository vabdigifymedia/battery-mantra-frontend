import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Edit, Plus, Trash2 } from "lucide-react";
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
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
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading pages...
                </TableCell>
              </TableRow>
            ) : !pages?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No CMS pages found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.pageId}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-muted-foreground">/{page.seo?.slug || page.pageId}</TableCell>
                  <TableCell>
                    <Badge variant={page.isActive ? "default" : "secondary"}>
                      {page.isActive ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{page.createdAt ? new Date(page.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/pages/${page.pageId}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(page.pageId)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
