import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { Save, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/seo/pages")({
  component: SeoPagesPage,
});

function SeoPagesPage() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["seo", "pages"],
    queryFn: async () => {
      const res = await adminService.api.get("/api/seo/pages");
      return res.data;
    }
  });

  const [editItem, setEditItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminService.api.delete(`/api/seo/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo", "pages"] });
      toast.success("Page SEO deleted successfully");
    }
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Pages</h1>
          <p className="text-muted-foreground mt-2">Manage SEO metadata for static website pages.</p>
        </div>
        <Button onClick={() => { setEditItem(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Page
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page Name</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>SEO Title</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No SEO pages configured.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((p: any) => (
                <TableRow key={p.pageId}>
                  <TableCell className="font-medium">{p.pageName}</TableCell>
                  <TableCell>{p.pageRoute}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{p.seo?.metaTitle || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(p); setIsDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm("Are you sure?")) deleteMutation.mutate(p.pageId);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Page SEO" : "Add Page SEO"}</DialogTitle>
          </DialogHeader>
          <SeoPageForm 
            initialData={editItem} 
            onClose={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeoPageForm({ initialData, onClose }: any) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      pageName: initialData?.pageName || "",
      pageRoute: initialData?.pageRoute || "",
      seo: {
        metaTitle: initialData?.seo?.metaTitle || "",
        metaDescription: initialData?.seo?.metaDescription || "",
        metaKeywords: initialData?.seo?.metaKeywords || "",
        ogTitle: initialData?.seo?.ogTitle || "",
        ogDescription: initialData?.seo?.ogDescription || "",
        canonicalUrl: initialData?.seo?.canonicalUrl || "",
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (initialData?.pageId) {
        await adminService.api.put(`/api/seo/pages/${initialData.pageId}`, data);
      } else {
        await adminService.api.post("/api/seo/pages", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo", "pages"] });
      toast.success("Page SEO saved successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to save SEO");
    }
  });

  return (
    <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Page Name</Label>
          <Input placeholder="e.g. About Us" {...register("pageName", { required: "Required" })} />
        </div>
        <div className="space-y-2">
          <Label>Page Route</Label>
          <Input placeholder="e.g. /about" {...register("pageRoute", { required: "Required" })} />
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label>SEO Title</Label>
        <Input {...register("seo.metaTitle")} />
      </div>
      <div className="space-y-2">
        <Label>SEO Keywords</Label>
        <Input {...register("seo.metaKeywords")} />
      </div>
      <div className="space-y-2">
        <Label>SEO Description</Label>
        <Input {...register("seo.metaDescription")} />
      </div>
      <div className="space-y-2 pt-4 border-t">
        <Label>OG Title</Label>
        <Input {...register("seo.ogTitle")} />
      </div>
      <div className="space-y-2">
        <Label>OG Description</Label>
        <Input {...register("seo.ogDescription")} />
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Spinner size="sm" className="mr-2" />}
          <Save className="h-4 w-4 mr-2" /> Save
        </Button>
      </div>
    </form>
  );
}
