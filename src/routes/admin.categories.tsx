import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryListResponse) => {
    setEditingCategory(category);
    form.reset({
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription ?? "",
      iconUrl: category.iconUrl ?? "",
      displayOrder: category.displayOrder ?? 0,
      parentId: category.parentId ?? null,
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
    };

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

      <div className="rounded-md border bg-card">
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

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px]">
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

            <FormField label="Icon URL" htmlFor="iconUrl" hint="URL to an image icon" error={form.formState.errors.iconUrl?.message}>
              <Input id="iconUrl" {...form.register("iconUrl")} placeholder="https://..." />
            </FormField>

            <FormField label="Display Order" htmlFor="displayOrder" error={form.formState.errors.displayOrder?.message}>
              <Input id="displayOrder" type="number" {...form.register("displayOrder")} />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
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
