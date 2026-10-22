import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { brandsQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Tag, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/FormField";
import { generateSlug, applySeoTemplate } from "@/lib/utils";
import { VariableChipsHelper } from "@/components/admin/VariableChipsHelper";
import { apiFetch } from "@/lib/api/client";
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

export const Route = createFileRoute("/kalkaji/brands")({
  component: AdminBrands,
});

const brandSchema = z.object({
  brandName: z.string().trim().min(1, "Name is required"),
  brandLogo: z.string().trim().optional(),
  description: z.string().optional(),
  dealerDescription: z.string().optional(),
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

  const { data: templates } = useQuery({
    queryKey: ["seo", "templates"],
    queryFn: () => apiFetch<any[]>("/api/seo/templates"),
  });

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema) as any,
    defaultValues: {
      brandName: "",
      brandLogo: "",
      description: "",
      dealerDescription: "",
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

  const watchedBrandName = form.watch("brandName");
  
  useEffect(() => {
    if (!editingBrand && watchedBrandName) {
      form.setValue("seo.slug", generateSlug(watchedBrandName));
    }
  }, [watchedBrandName, editingBrand, form]);

  const openAddModal = () => {
    setEditingBrand(null);
    form.reset({
      brandName: "",
      brandLogo: "",
      description: "",
      dealerDescription: "",
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
    
    const currentSlug = brand.seo?.slug || brand.slug || generateSlug(brand.brandName || "");
    let newSeo = { 
      ...(brand.seo || {}),
      slug: currentSlug,
    };
    
    if (templates && templates.length > 0) {
      const templateWithoutCity = templates.find((t: any) => t.templateType === "BRAND_WITHOUT_CITY");
      const templateWithCity = templates.find((t: any) => t.templateType === "BRAND_WITH_CITY");
      const context = { brand_name: brand.brandName || "" };
      
      if (templateWithoutCity) {
        if (!newSeo.metaTitle && templateWithoutCity.seoTitleTemplate) newSeo.metaTitle = applySeoTemplate(templateWithoutCity.seoTitleTemplate, context);
        if (!newSeo.metaDescription && templateWithoutCity.seoDescriptionTemplate) newSeo.metaDescription = applySeoTemplate(templateWithoutCity.seoDescriptionTemplate, context);
        if (!newSeo.metaKeywords && templateWithoutCity.seoKeywordsTemplate) newSeo.metaKeywords = applySeoTemplate(templateWithoutCity.seoKeywordsTemplate, context);
        if (!newSeo.ogTitle && templateWithoutCity.ogTitleTemplate) newSeo.ogTitle = applySeoTemplate(templateWithoutCity.ogTitleTemplate, context);
        if (!newSeo.ogDescription && templateWithoutCity.ogDescriptionTemplate) newSeo.ogDescription = applySeoTemplate(templateWithoutCity.ogDescriptionTemplate, context);
      }
      if (templateWithCity) {
        if (!newSeo.metaTitleCity && templateWithCity.seoTitleTemplate) newSeo.metaTitleCity = applySeoTemplate(templateWithCity.seoTitleTemplate, context);
        if (!newSeo.metaDescriptionCity && templateWithCity.seoDescriptionTemplate) newSeo.metaDescriptionCity = applySeoTemplate(templateWithCity.seoDescriptionTemplate, context);
        if (!newSeo.metaKeywordsCity && templateWithCity.seoKeywordsTemplate) newSeo.metaKeywordsCity = applySeoTemplate(templateWithCity.seoKeywordsTemplate, context);
      }
    }

    form.reset({
      brandName: brand.brandName,
      brandLogo: brand.brandLogo ?? "",
      description: brand.description ?? "",
      dealerDescription: brand.dealerDescription ?? "",
      featured: brand.featured ?? false,
      seo: newSeo
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
    const finalSlug = (values.seo?.slug || "").trim() || generateSlug(values.brandName);
    const payload: any = {
      brandName: values.brandName,
      brandLogo: values.brandLogo,
      description: values.description,
      dealerDescription: values.dealerDescription,
      featured: values.featured,
      slug: finalSlug,
      seo: {
        ...(values.seo || {}),
        slug: finalSlug,
      },
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
                  <TableCell>
                    <div className="font-medium text-foreground">{brand.brandName}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      /{brand.seo?.slug || brand.slug || generateSlug(brand.brandName)}
                    </div>
                  </TableCell>
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
            
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
              <FileEdit className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-foreground">Category-Specific Descriptions & Dealer Content</p>
                <p className="text-muted-foreground">
                  Brand descriptions and authorized dealer content are managed per Category (e.g., Inverter Battery vs Car Battery) under <strong>Brand Contents</strong>.
                </p>
                <Link 
                  to="/kalkaji/brand-contents" 
                  className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-0.5"
                >
                  Manage Category Descriptions in Brand Contents &rarr;
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="featured" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...form.register("featured")} />
              <label htmlFor="featured" className="text-sm font-medium text-foreground">Feature this brand on the homepage</label>
            </div>

            {editingBrand && (
              <div className="pt-6 pb-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">SEO Information</h3>
                  <p className="text-sm text-muted-foreground">Configure search engine optimization for this brand</p>
                </div>

                <VariableChipsHelper type="BRANDS" compact={true} />
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brand URL (Slug)</Label>
                      <Input placeholder="Leave blank to auto-generate" {...form.register("seo.slug")} />
                    </div>
                    <div className="space-y-2">
                      <Label>SEO Title</Label>
                      <AutoResizeTextarea placeholder="Buy Brand at Best Price" {...form.register("seo.metaTitle")} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Search / SEO Keywords</Label>
                    <AutoResizeTextarea placeholder="Brand price, buy brand..." {...form.register("seo.metaKeywords")} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <AutoResizeTextarea placeholder="Buy Brand At Best Price | Cash On Delivery..." {...form.register("seo.metaDescription")} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>SEO Title City</Label>
                      <AutoResizeTextarea placeholder="Brand Price in city_name" {...form.register("seo.metaTitleCity")} />
                    </div>
                    <div className="space-y-2">
                      <Label>SEO Keywords City</Label>
                      <AutoResizeTextarea placeholder="Brand At Best Price in city_name" {...form.register("seo.metaKeywordsCity")} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SEO Description City</Label>
                    <AutoResizeTextarea placeholder="Buy Brand At Best Price in city_name..." {...form.register("seo.metaDescriptionCity")} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4 border-muted">
                    <div className="space-y-2 mt-4">
                      <Label>OG Title</Label>
                      <AutoResizeTextarea placeholder="OG Title" {...form.register("seo.ogTitle")} />
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>OG Description</Label>
                      <AutoResizeTextarea placeholder="OG Description" {...form.register("seo.ogDescription")} />
                    </div>
                    <div className="space-y-2">
                      <Label>OG Title City</Label>
                      <AutoResizeTextarea placeholder="OG Title City" {...form.register("seo.ogTitleCity")} />
                    </div>
                    <div className="space-y-2">
                      <Label>OG Description City</Label>
                      <AutoResizeTextarea placeholder="OG Description City" {...form.register("seo.ogDescriptionCity")} />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
