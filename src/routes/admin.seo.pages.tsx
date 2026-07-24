import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
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

import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/seo/pages")({
  component: SeoPagesPage,
});

function SeoPagesPage() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["seo", "pages"],
    queryFn: () => apiFetch<any[]>("/api/seo/pages"),
  });

  const [editItem, setEditItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/seo/pages/${id}`, { method: "DELETE" });
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Pages</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage SEO metadata (Title, Keywords, Description) for static website pages.</p>
        </div>
        <Button onClick={() => { setEditItem(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Page
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] font-semibold">Page</TableHead>
              <TableHead className="w-[280px] font-semibold">Title</TableHead>
              <TableHead className="w-[280px] font-semibold">Keywords</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="w-[100px] text-right font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No SEO pages configured. Execute the SQL seed script to load all 22 default pages.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((p: any) => (
                <TableRow key={p.pageId}>
                  <TableCell className="font-medium">{p.pageName}</TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="line-clamp-2 text-xs text-muted-foreground" title={p.seo?.metaTitle}>
                      {p.seo?.metaTitle || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="line-clamp-2 text-xs text-muted-foreground" title={p.seo?.metaKeywords}>
                      {p.seo?.metaKeywords || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="line-clamp-2 text-xs text-muted-foreground" title={p.seo?.metaDescription}>
                      {p.seo?.metaDescription || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(p); setIsDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm(`Delete SEO entry for "${p.pageName}"?`)) deleteMutation.mutate(p.pageId);
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
            <DialogTitle>
              {editItem ? `Update ${editItem.pageName}` : "Add Page SEO"}
            </DialogTitle>
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
  const { register, handleSubmit } = useForm({
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
        await apiFetch(`/api/seo/pages/${initialData.pageId}`, { method: "PUT", body: data });
      } else {
        await apiFetch("/api/seo/pages", { method: "POST", body: data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo", "pages"] });
      toast.success("Page SEO saved successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to save Page SEO");
    }
  });

  return (
    <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Page Name</Label>
          <Input placeholder="e.g. About Us" {...register("pageName", { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Page Route</Label>
          <Input placeholder="e.g. /about" {...register("pageRoute", { required: true })} />
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t">
        <Label className="text-xs font-semibold">Title</Label>
        <Textarea rows={2} placeholder="SEO Meta Title" {...register("seo.metaTitle")} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Keywords</Label>
        <Textarea rows={3} placeholder="Comma-separated SEO keywords" {...register("seo.metaKeywords")} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Description</Label>
        <Textarea rows={3} placeholder="SEO Meta Description" {...register("seo.metaDescription")} />
      </div>

      <div className="space-y-1.5 pt-2 border-t">
        <Label className="text-xs font-semibold">OG Title (Social Sharing)</Label>
        <Input placeholder="Social share title" {...register("seo.ogTitle")} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">OG Description (Social Sharing)</Label>
        <Textarea rows={2} placeholder="Social share description" {...register("seo.ogDescription")} />
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="brand" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Spinner size="sm" className="mr-2" />}
          <Save className="h-4 w-4 mr-2" /> Save
        </Button>
      </div>
    </form>
  );
}

