import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { manufacturersListQuery } from "@/queries";
import { manufacturersService } from "@/services/manufacturers.service";
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
import type { ManufacturerResponse, CreateManufacturerRequest, UpdateManufacturerRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/constants/queryKeys";

export const Route = createFileRoute("/admin/manufacturers")({
  component: AdminManufacturers,
});

const manufacturerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  logoUrl: z.string().trim().optional(),
  displayOrder: z.coerce.number().optional(),
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<any>(null);

  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      displayOrder: 0,
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
      displayOrder: 0,
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
    form.reset({
      name: manufacturer.name,
      logoUrl: manufacturer.logoUrl ?? "",
      displayOrder: manufacturer.displayOrder ?? 0,
      seo: manufacturer.seo || {
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
    setEditingManufacturer(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => manufacturersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.list() });
      toast.success("Manufacturer created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create manufacturer"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      manufacturersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.list() });
      toast.success("Manufacturer updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update manufacturer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.list() });
      toast.success("Manufacturer deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete manufacturer"),
  });

  const onSubmit = (data: ManufacturerFormValues) => {
    const payload: any = {
      name: data.name,
      logoUrl: data.logoUrl || undefined,
      displayOrder: data.displayOrder || 0,
      seo: data.seo,
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
                <TableCell colSpan={4} className="h-24 text-center">
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
            <FormField label="Display Order" error={form.formState.errors.displayOrder?.message}>
              <Input type="number" {...form.register("displayOrder")} placeholder="e.g. 1" />
            </FormField>

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
