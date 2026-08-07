import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { manufacturersListQuery, rootCategoriesQuery } from "@/queries";
import { Checkbox } from "@/components/ui/checkbox";
import { manufacturersService } from "@/services/manufacturers.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Tag } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/FormField";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateSlug, applySeoTemplate } from "@/lib/utils";
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
import type { ManufacturerResponse, CreateManufacturerRequest, UpdateManufacturerRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/constants/queryKeys";

export const Route = createFileRoute("/admin/manufacturers")({
  component: AdminManufacturers,
});

const manufacturerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  logoUrl: z.string().trim().optional(),
  description: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  categoryIds: z.array(z.string()).default([]),
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
  }).optional().default({}),
});

type ManufacturerFormValues = z.infer<typeof manufacturerSchema>;

function AdminManufacturers() {
  const queryClient = useQueryClient();
  const { data: manufacturers, isLoading } = useQuery(manufacturersListQuery());
  const { data: rootCategories = [] } = useQuery(rootCategoriesQuery());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<any>(null);

  const { data: templates } = useQuery({
    queryKey: ["seo", "templates"],
    queryFn: () => apiFetch<any[]>("/api/seo/templates"),
  });

  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerSchema) as any,
    defaultValues: {
      name: "",
      logoUrl: "",
      description: "",
      displayOrder: 0,
      categoryIds: [] as string[],
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
    setEditingManufacturer(null);
    form.reset({
      name: "",
      logoUrl: "",
      description: "",
      displayOrder: 0,
      categoryIds: [],
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

  const openEditModal = (manufacturer: any) => {
    setEditingManufacturer(manufacturer);
    
    let newSeo = { ...(manufacturer.seo || {}) };
    
    if (templates && templates.length > 0) {
      const templateWithoutCity = templates.find((t: any) => t.templateType === "MANUFACTURER_WITHOUT_CITY");
      const templateWithCity = templates.find((t: any) => t.templateType === "MANUFACTURER_WITH_CITY");
      const context = { manufacturer_name: manufacturer.name || "" };
      
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
      name: manufacturer.name,
      logoUrl: manufacturer.logoUrl ?? "",
      description: manufacturer.description ?? "",
      displayOrder: manufacturer.displayOrder ?? 0,
      categoryIds: manufacturer.categories?.map((c: any) => c.categoryId) ?? [],
      seo: newSeo
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingManufacturer(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => manufacturersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      toast.success("Manufacturer created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create manufacturer"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      manufacturersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      toast.success("Manufacturer updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update manufacturer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      toast.success("Manufacturer deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete manufacturer"),
  });

  const onSubmit = (data: ManufacturerFormValues) => {
    const payload: any = {
      name: data.name,
      logoUrl: data.logoUrl || undefined,
      description: data.description,
      displayOrder: data.displayOrder || 0,
      categoryIds: data.categoryIds || [],
      seo: editingManufacturer ? data.seo : { slug: generateSlug(data.name) },
    };

    if (editingManufacturer) {
      editMutation.mutate({ id: editingManufacturer.id, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manufacturers</h1>
          <p className="text-muted-foreground">Manage vehicle manufacturers and their logos.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Manufacturer
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manufacturers?.map((manufacturer) => (
              <TableRow key={manufacturer.id}>
                <TableCell>
                  {manufacturer.logoUrl ? (
                    <img 
                      src={manufacturer.logoUrl} 
                      alt={manufacturer.name} 
                      className="h-10 w-10 object-contain rounded border bg-white p-1"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded border bg-muted">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{manufacturer.name}</TableCell>
                <TableCell>
                  {manufacturer.categories?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {manufacturer.categories.map((c) => (
                        <span key={c.categoryId} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {c.categoryName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{manufacturer.displayOrder}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(manufacturer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the manufacturer "{manufacturer.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(manufacturer.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {!manufacturers?.length && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No manufacturers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingManufacturer ? "Edit Manufacturer" : "Add Manufacturer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Manufacturer Name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="e.g. Maruti Suzuki" />
            </FormField>
            <Controller
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <CloudinaryUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  folder="battery-mantra/manufacturers"
                  label="Logo URL (Cloudinary)"
                  error={form.formState.errors.logoUrl?.message}
                />
              )}
            />
            
            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormField label="Manufacturer Description (HTML / SEO Content)" htmlFor="description" error={form.formState.errors.description?.message}>
                  <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                </FormField>
              )}
            />

            <FormField label="Display Order" error={form.formState.errors.displayOrder?.message}>
              <Input type="number" {...form.register("displayOrder")} placeholder="e.g. 1" />
            </FormField>

            <div className="space-y-2">
              <Label>Categories</Label>
              <p className="text-xs text-muted-foreground mb-2">Select categories this manufacturer belongs to</p>
              <Controller
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {rootCategories.map((cat) => {
                      const isChecked = field.value?.includes(cat.categoryId) ?? false;
                      return (
                        <label
                          key={cat.categoryId}
                          className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              if (checked) {
                                field.onChange([...current, cat.categoryId]);
                              } else {
                                field.onChange(current.filter((id: string) => id !== cat.categoryId));
                              }
                            }}
                          />
                          <span className="text-sm">{cat.categoryName}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {editingManufacturer && (
              <div className="pt-6 pb-2">
                <h3 className="text-lg font-semibold">SEO Information</h3>
                <p className="text-sm text-muted-foreground mb-4">Configure search engine optimization for this manufacturer</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Manufacturer URL (Slug)</Label>
                      <Input placeholder="Leave blank to auto-generate" {...form.register("seo.slug")} />
                    </div>
                    <div className="space-y-2">
                      <Label>SEO Title</Label>
                      <Input placeholder="Buy Manufacturer at Best Price" {...form.register("seo.metaTitle")} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Search / SEO Keywords</Label>
                    <Input placeholder="Manufacturer price, buy manufacturer..." {...form.register("seo.metaKeywords")} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <Input placeholder="Buy Manufacturer At Best Price | Cash On Delivery..." {...form.register("seo.metaDescription")} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>SEO Title City</Label>
                      <Input placeholder="Manufacturer Price in city_name" {...form.register("seo.metaTitleCity")} />
                    </div>
                    <div className="space-y-2">
                      <Label>SEO Keywords City</Label>
                      <Input placeholder="Manufacturer At Best Price in city_name" {...form.register("seo.metaKeywordsCity")} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SEO Description City</Label>
                    <Input placeholder="Buy Manufacturer At Best Price in city_name..." {...form.register("seo.metaDescriptionCity")} />
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
            )}

            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) && <Spinner className="mr-2 h-4 w-4" />}
                {editingManufacturer ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
