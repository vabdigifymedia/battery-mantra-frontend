import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import type { BannerResponse, CreateBannerRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/constants/queryKeys";

export const Route = createFileRoute("/admin/banners")({
  component: AdminBanners,
});

const bannerSchema = z.object({
  title: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").min(1, "Image URL is required"),
  linkUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().default(0),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

function AdminBanners() {
  const queryClient = useQueryClient();
  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => adminService.getAllBanners(),
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      linkUrl: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  const openAddModal = () => {
    setEditingBanner(null);
    setShowAdvanced(false);
    form.reset({
      title: "",
      imageUrl: "",
      linkUrl: "",
      isActive: true,
      displayOrder: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: BannerResponse) => {
    setEditingBanner(banner);
    setShowAdvanced(false);
    form.reset({
      title: banner.title ?? "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? "",
      isActive: banner.isActive ?? true,
      displayOrder: banner.displayOrder ?? 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setShowAdvanced(false);
    form.reset();
  };

  const invalidateBanners = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.banners.active() });
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateBannerRequest) => adminService.createBanner(data),
    onSuccess: () => {
      invalidateBanners();
      toast.success("Banner created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create banner"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBannerRequest }) => adminService.updateBanner(id, data),
    onSuccess: () => {
      invalidateBanners();
      toast.success("Banner updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update banner"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteBanner(id),
    onSuccess: () => {
      invalidateBanners();
      toast.success("Banner deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete banner"),
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload: CreateBannerRequest = {
      ...values,
      linkUrl: values.linkUrl || undefined,
      title: values.title || undefined,
    };

    if (editingBanner) {
      editMutation.mutate({ id: editingBanner.bannerId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  });

  const sortedBanners = [...(banners || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Banners</h2>
          <p className="text-muted-foreground">Manage homepage promotional banners.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading banners...
                </TableCell>
              </TableRow>
            ) : !sortedBanners?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No banners found.
                </TableCell>
              </TableRow>
            ) : (
              sortedBanners.map((banner) => (
                <TableRow key={banner.bannerId}>
                  <TableCell>
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title || "Banner"} className="h-12 w-full object-cover rounded border" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{banner.title || <span className="text-muted-foreground italic">None</span>}</TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">{banner.linkUrl || "-"}</TableCell>
                  <TableCell>{banner.displayOrder}</TableCell>
                  <TableCell>
                    {banner.isActive ? (
                      <span className="rounded bg-success/20 px-2 py-1 text-xs font-medium text-success">Active</span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(banner)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the banner "{banner.title || banner.bannerId}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(banner.bannerId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="sm" className="mr-2" /> Loading...
          </div>
        ) : !sortedBanners?.length ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card border-dashed">
            No banners found.
          </div>
        ) : (
          sortedBanners.map((banner) => (
            <div key={banner.bannerId} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title || "Banner"} className="h-12 w-full object-cover rounded border" />
                  ) : (
                    <div className="h-12 w-full flex items-center justify-center border rounded bg-muted">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold truncate">{banner.title || <span className="text-muted-foreground italic">Untitled</span>}</div>
                    {banner.isActive ? (
                      <span className="shrink-0 rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-medium text-success uppercase">Active</span>
                    ) : (
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">Inactive</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {banner.linkUrl ? (
                      <span>Link: {banner.linkUrl}</span>
                    ) : (
                      <span>No Link</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t">
                <div className="text-xs text-muted-foreground">Order: <span className="font-medium text-foreground">{banner.displayOrder}</span></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the banner "{banner.title || banner.bannerId}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(banner.bannerId)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <CloudinaryUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="battery-mantra/banners"
                  label="Image URL *"
                  error={form.formState.errors.imageUrl?.message}
                />
              )}
            />

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-border pt-4 animate-in fade-in duration-200">
                <FormField label="Title" htmlFor="title" hint="Optional description (optional)" error={form.formState.errors.title?.message}>
                  <Input id="title" {...form.register("title")} placeholder="e.g. Diwali Sale" />
                </FormField>

                <FormField label="Link URL" htmlFor="linkUrl" hint="Where the banner links to on click (optional)" error={form.formState.errors.linkUrl?.message}>
                  <Input id="linkUrl" {...form.register("linkUrl")} placeholder="https://... or /products?..." />
                </FormField>

                <FormField label="Display Order" htmlFor="displayOrder" required hint="Lower numbers show first" error={form.formState.errors.displayOrder?.message}>
                  <Input id="displayOrder" type="number" {...form.register("displayOrder")} />
                </FormField>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isActive" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...form.register("isActive")} />
                  <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active (Visible on Homepage)</label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingBanner ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
