import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
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
  seo: z.object({
    slug: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    metaTitleCity: z.string().optional(),
    metaDescriptionCity: z.string().optional(),
    metaKeywordsCity: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogTitleCity: z.string().optional(),
    ogDescriptionCity: z.string().optional(),
    canonicalUrl: z.string().optional(),
  }).optional().default({})
});

type BrandFormValues = z.infer<typeof brandSchema>;

function AdminBrands() {
  const queryClient = useQueryClient();
  const { data: brands, isLoading } = useQuery(brandsQuery());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      brandName: "",
      brandLogo: "",
      featured: false,
      seo: {
        slug: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        metaTitleCity: "",
        metaDescriptionCity: "",
        metaKeywordsCity: "",
        ogTitle: "",
        ogDescription: "",
        ogTitleCity: "",
        ogDescriptionCity: "",
        canonicalUrl: "",
      }
    },
  });

  const openAddModal = () => {
    setEditingBrand(null);
    form.reset({
      brandName: "",
      brandLogo: "",
      featured: false,
      seo: {
        slug: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        metaTitleCity: "",
        metaDescriptionCity: "",
        metaKeywordsCity: "",
        ogTitle: "",
        ogDescription: "",
        ogTitleCity: "",
        ogDescriptionCity: "",
        canonicalUrl: "",
      }
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    form.reset({
      brandName: brand.brandName,
      brandLogo: brand.brandLogo ?? "",
      featured: brand.featured ?? false,
      seo: brand.seo || {
        slug: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        metaTitleCity: "",
        metaDescriptionCity: "",
        metaKeywordsCity: "",
        ogTitle: "",
        ogDescription: "",
        ogTitleCity: "",
        ogDescriptionCity: "",
        canonicalUrl: "",
      }
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => adminService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create brand"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateBrand(id, data),
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
    const payload: any = {
      brandName: values.brandName,
      brandLogo: values.brandLogo,
      featured: values.featured,
      seo: values.seo,
    };
    if (editingBrand) {
      editMutation.mutate({ id: editingBrand.brandId, data: payload });
    } else {
      addMutation.mutate(payload);
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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

            <div className="pt-6 pb-2">
              <h3 className="text-lg font-semibold">SEO Information</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure search engine optimization for this brand</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand URL (Slug)</Label>
                    <Input placeholder="Leave blank to auto-generate" {...form.register("seo.slug")} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input placeholder="Buy Brand at Best Price" {...form.register("seo.metaTitle")} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Search / SEO Keywords</Label>
                  <Input placeholder="Brand price, buy brand..." {...form.register("seo.metaKeywords")} />
                </div>
                
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Input placeholder="Buy Brand At Best Price | Cash On Delivery..." {...form.register("seo.metaDescription")} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>SEO Title City</Label>
                    <Input placeholder="Brand Price in city_name" {...form.register("seo.metaTitleCity")} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Keywords City</Label>
                    <Input placeholder="Brand At Best Price in city_name" {...form.register("seo.metaKeywordsCity")} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>SEO Description City</Label>
                  <Input placeholder="Buy Brand At Best Price in city_name..." {...form.register("seo.metaDescriptionCity")} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4 border-muted">
                  <div className="space-y-2 mt-4">
                    <Label>OG Title</Label>
                    <Input placeholder="OG Title" {...form.register("seo.ogTitle")} />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>OG Description</Label>
                    <Input placeholder="OG Description" {...form.register("seo.ogDescription")} />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Title City</Label>
                    <Input placeholder="OG Title City" {...form.register("seo.ogTitleCity")} />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Description City</Label>
                    <Input placeholder="OG Description City" {...form.register("seo.ogDescriptionCity")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
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
