import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFaqsQuery } from "@/queries";
import { faqService } from "@/services/faq.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/faqs/")({
  component: AdminFaqsList,
});

function AdminFaqsList() {
  const queryClient = useQueryClient();
  const { data: faqs, isLoading } = useQuery(adminFaqsQuery());

  const deleteMutation = useMutation({
    mutationFn: faqService.deleteFaq,
    onSuccess: () => {
      toast.success("FAQ deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
    },
    onError: () => toast.error("Failed to delete FAQ"),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">FAQs</h2>
          <p className="text-muted-foreground">Manage dynamic FAQs for all pages.</p>
        </div>
        <Button asChild>
          <Link to="/admin/faqs/new">
            <Plus className="mr-2 h-4 w-4" /> Add FAQ
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Page Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading FAQs...
                </TableCell>
              </TableRow>
            ) : !faqs?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No FAQs found.
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq) => (
                <TableRow key={faq.faqId}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{faq.pageType}</Badge>
                  </TableCell>
                  <TableCell>{faq.title}</TableCell>
                  <TableCell>
                    <Badge variant={faq.isActive ?? faq.active ? "default" : "destructive"}>
                      {faq.isActive ?? faq.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/faqs/$id/edit" params={{ id: faq.faqId }}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this FAQ?")) {
                            deleteMutation.mutate(faq.faqId);
                          }
                        }}
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
