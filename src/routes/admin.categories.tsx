import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { rootCategoriesQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Layers, CornerDownRight } from "lucide-react";
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
import type { CategoryListResponse, CreateCategoryRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

const categorySchema = z.object({
  categoryName: z.string().trim().min(1, "Name is required"),
  categoryDescription: z.string().trim().optional(),
  iconUrl: z.string().trim().optional(),
  displayOrder: z.coerce.number().optional(),
  parentId: z.string().uuid().optional().nullable().or(z.literal("")),
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

type CategoryFormValues = z.infer<typeof categorySchema>;

function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery(rootCategoriesQuery());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListResponse | null>(null);

  // Flatten categories for the dropdown options (excluding the currently editing category and its children to prevent circular reference)
  const flattenedCategories = useMemo(() => {
    const list: { id: string; name: string; level: number }[] = [];
    if (!categories) return list;
    
    function traverse(cats: CategoryListResponse[], level: number) {
      // Sort by display order
      const sorted = [...cats].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      for (const cat of sorted) {
        // Skip if this is the category we're editing (prevent assigning self as parent)
        if (editingCategory && cat.categoryId === editingCategory.categoryId) continue;
        
        list.push({ id: cat.categoryId, name: cat.categoryName, level });
        if (cat.subCategories && cat.subCategories.length > 0) {
          traverse(cat.subCategories, level + 1);
        }
      }
    }
    traverse(categories, 0);
    return list;
  }, [categories, editingCategory]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: "",
      categoryDescription: "",
      iconUrl: "",
      displayOrder: 0,
      parentId: null,
    },
  });

  const openAddModal = (parentId: string | null = null) => {
    setEditingCategory(null);
    form.reset({
      categoryName: "",
      categoryDescription: "",
      iconUrl: "",
      displayOrder: 0,
      parentId,
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

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    form.reset({
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription ?? "",
      iconUrl: category.iconUrl ?? "",
      displayOrder: category.displayOrder ?? 0,
      parentId: category.parentId ?? null,
      seo: category.seo || {
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
    setEditingCategory(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => adminService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create category"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCategoryRequest }) => adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete category"),
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload: CreateCategoryRequest = {
      categoryName: values.categoryName,
      categoryDescription: values.categoryDescription,
      iconUrl: values.iconUrl,
      displayOrder: values.displayOrder,
      parentId: values.parentId || undefined, // Convert empty string or null to undefined
      seo: values.seo,
    } as any;

    if (editingCategory) {
      editMutation.mutate({ id: editingCategory.categoryId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  });

  // Recursive rendering function for categories
  const renderCategoryRows = (cats: CategoryListResponse[], depth: number = 0) => {
    const sorted = [...cats].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const rows: React.ReactNode[] = [];

    sorted.forEach((category) => {
      rows.push(
        <TableRow key={category.categoryId}>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {depth > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              {category.iconUrl ? (
                <img src={category.iconUrl} alt={category.categoryName} className="h-8 w-8 object-contain mix-blend-multiply rounded" />
              ) : (
                <Layers className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </TableCell>
          <TableCell className="font-medium">
            <span style={{ paddingLeft: depth === 0 ? "0px" : "8px" }}>
              {category.categoryName}
            </span>
          </TableCell>
          <TableCell className="max-w-xs truncate">{category.categoryDescription || "N/A"}</TableCell>
          <TableCell>{category.displayOrder ?? 0}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" onClick={() => openAddModal(category.categoryId)} title="Add Subcategory">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
                <Edit className="h-4 w-4 text-muted-foreground" />
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
                      This will permanently delete the category "{category.categoryName}" and all of its subcategories.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate(category.categoryId)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
      );

      if (category.subCategories && category.subCategories.length > 0) {
        rows.push(...renderCategoryRows(category.subCategories, depth + 1));
      }
    });

    return rows;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage your product categories and subcategories.</p>
        </div>
        <Button onClick={() => openAddModal(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add Root Category
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Order</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading categories...
                </TableCell>
              </TableRow>
            ) : !categories?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              renderCategoryRows(categories)
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
        ) : !categories?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            No categories found.
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const renderMobileCards = (cats: CategoryListResponse[], depth: number = 0) => {
                const sorted = [...cats].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
                const elements: React.ReactNode[] = [];
                
                sorted.forEach((category) => {
                  elements.push(
                    <div key={category.categoryId} className="rounded-xl border bg-card p-3 shadow-sm relative overflow-hidden" style={{ marginLeft: `${depth * 16}px` }}>
                      {depth > 0 && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted"></div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {category.iconUrl ? (
                            <div className="w-10 h-10 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center">
                              <img src={category.iconUrl} alt={category.categoryName} className="w-full h-full object-contain p-1 mix-blend-multiply" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center text-muted-foreground">
                              {depth > 0 ? <CornerDownRight className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm truncate">{category.categoryName}</h3>
                            <span className="text-xs text-muted-foreground font-mono shrink-0">#{category.displayOrder ?? 0}</span>
                          </div>
                          {category.categoryDescription && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{category.categoryDescription}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => openAddModal(category.categoryId)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Sub
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEditModal(category)}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{category.categoryName}" and all subcategories.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(category.categoryId)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                  
                  if (category.subCategories && category.subCategories.length > 0) {
                    elements.push(...renderMobileCards(category.subCategories, depth + 1));
                  }
                });
                
                return elements;
              };
              
              return renderMobileCards(categories);
            })()}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            
            <FormField label="Parent Category" htmlFor="parentId" error={form.formState.errors.parentId?.message}>
              <select
                id="parentId"
                {...form.register("parentId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">None (Root Category)</option>
                {flattenedCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {"\u00A0\u00A0".repeat(cat.level)}{cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Name" htmlFor="categoryName" required error={form.formState.errors.categoryName?.message}>
              <Input id="categoryName" {...form.register("categoryName")} placeholder="e.g. Car Batteries" />
            </FormField>
            
            <FormField label="Description" htmlFor="categoryDescription" error={form.formState.errors.categoryDescription?.message}>
              <Input id="categoryDescription" {...form.register("categoryDescription")} />
            </FormField>

            <Controller
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <CloudinaryUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  folder="battery-mantra/categories"
                  label="Icon URL (Optional)"
                  error={form.formState.errors.iconUrl?.message}
                />
              )}
            />

            <FormField label="Display Order" htmlFor="displayOrder" error={form.formState.errors.displayOrder?.message}>
              <Input id="displayOrder" type="number" {...form.register("displayOrder")} />
            </FormField>

            <div className="pt-6 pb-2">
              <h3 className="text-lg font-semibold">SEO Information</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure search engine optimization for this category</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category URL (Slug)</Label>
                    <Input placeholder="Leave blank to auto-generate" {...form.register("seo.slug")} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input placeholder="Buy Category at Best Price" {...form.register("seo.metaTitle")} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Search / SEO Keywords</Label>
                  <Input placeholder="Category price, buy category..." {...form.register("seo.metaKeywords")} />
                </div>
                
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Input placeholder="Buy Category At Best Price | Cash On Delivery..." {...form.register("seo.metaDescription")} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>SEO Title City</Label>
                    <Input placeholder="Category Price in city_name" {...form.register("seo.metaTitleCity")} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Keywords City</Label>
                    <Input placeholder="Category At Best Price in city_name" {...form.register("seo.metaKeywordsCity")} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>SEO Description City</Label>
                  <Input placeholder="Buy Category At Best Price in city_name..." {...form.register("seo.metaDescriptionCity")} />
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
                {editingCategory ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
