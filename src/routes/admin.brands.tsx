import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { brandsQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Tag } from "lucide-react";
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
import type { BrandResponse, BrandRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/brands")({
  component: AdminBrands,
});

const brandSchema = z.object({
  brandName: z.string().trim().min(1, "Name is required"),
  brandLogo: z.string().trim().optional(),
  featured: z.boolean().default(false),
});

type BrandFormValues = z.infer<typeof brandSchema>;

function AdminBrands() {
  const queryClient = useQueryClient();
  const { data: brands, isLoading } = useQuery(brandsQuery());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandResponse | null>(null);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      brandName: "",
      brandLogo: "",
      featured: false,
    },
  });

  const openAddModal = () => {
    setEditingBrand(null);
    form.reset({
      brandName: "",
      brandLogo: "",
      featured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandResponse) => {
    setEditingBrand(brand);
    form.reset({
      brandName: brand.brandName,
      brandLogo: brand.brandLogo ?? "",
      featured: brand.featured ?? false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: BrandRequest) => adminService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create brand"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BrandRequest }) => adminService.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update brand"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete brand"),
  });

  const onSubmit = form.handleSubmit((values) => {
    if (editingBrand) {
      editMutation.mutate({ id: editingBrand.brandId, data: values });
    } else {
      addMutation.mutate(values);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Brands</h2>
          <p className="text-muted-foreground">Manage battery brands and logos.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Brand
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading brands...
                </TableCell>
              </TableRow>
            ) : !brands?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No brands found.
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => (
                <TableRow key={brand.brandId}>
                  <TableCell>
                    {brand.brandLogo ? (
                      <img src={brand.brandLogo} alt={brand.brandName} className="h-8 w-20 object-contain mix-blend-multiply" />
                    ) : (
                      <Tag className="h-6 w-6 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{brand.brandName}</TableCell>
                  <TableCell>
                    {brand.featured ? (
                      <span className="rounded bg-primary-soft px-2 py-1 text-xs font-medium text-primary">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(brand)}>
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
                            This will permanently delete the brand "{brand.brandName}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(brand.brandId)}
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
        ) : !brands?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            No brands found.
          </div>
        ) : (
          brands.map((brand) => (
            <div key={brand.brandId} className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-16 h-12 flex items-center justify-center border rounded-lg bg-muted/30 p-1">
                  {brand.brandLogo ? (
                    <img src={brand.brandLogo} alt={brand.brandName} className="h-full w-full object-contain mix-blend-multiply" />
                  ) : (
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{brand.brandName}</h3>
                  {brand.featured && (
                    <span className="inline-block mt-1 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">Featured</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(brand)}>
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
                        This will permanently delete the brand "{brand.brandName}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(brand.brandId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <FormField label="Name" htmlFor="brandName" required error={form.formState.errors.brandName?.message}>
              <Input id="brandName" {...form.register("brandName")} placeholder="e.g. Exide" />
            </FormField>

            <Controller
              control={form.control}
              name="brandLogo"
              render={({ field }) => (
                <CloudinaryUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  folder="battery-mantra/brands"
                  label="Logo URL (Optional)"
                  error={form.formState.errors.brandLogo?.message}
                />
              )}
            />

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="featured" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...form.register("featured")} />
              <label htmlFor="featured" className="text-sm font-medium text-foreground">Feature this brand on the homepage</label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingBrand ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
