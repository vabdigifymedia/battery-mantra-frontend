import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery, brandsQuery, vehiclesListQuery, productDetailQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  productName: z.string().min(2, "Name is required"),
  productDescription: z.string().optional(),
  productPrice: z.coerce.number().min(0, "Price must be positive"),
  productStock: z.coerce.number().min(0).optional(),
  productImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().uuid("Category is required"),
  brandId: z.string().uuid("Brand is required"),
  compatibleVehicleIds: z.array(z.string().uuid()).default([]),
  specs: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string().min(1, "Value is required")
  })).default([])
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/admin/products/$productId/edit")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const { data: product, isLoading, isError } = useQuery(productDetailQuery(productId));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Failed to load product details.
      </div>
    );
  }

  // Map product data to form default values
  const defaultValues: FormValues = {
    productName: product.productName,
    productDescription: product.productDescription || "",
    productPrice: product.productPrice,
    productStock: product.productStock || 0,
    productImage: product.productImage || "",
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    compatibleVehicleIds: product.compatibleVehicles?.map(v => v.vehicleId) || [],
    specs: product.specs
      ? Object.entries(product.specs).map(([key, value]) => ({ key, value: String(value) }))
      : [],
  };

  return <EditProductForm productId={productId} defaultValues={defaultValues} />;
}

function EditProductForm({ productId, defaultValues }: { productId: string; defaultValues: FormValues }) {
  const navigate = useNavigate();
  const { data: rootCategories = [] } = useQuery(rootCategoriesQuery());
  const { data: brands = [] } = useQuery(brandsQuery());
  const { data: vehicles = [] } = useQuery(vehiclesListQuery());

  const initialRootId = useMemo(() => {
    if (!rootCategories.length || !defaultValues.categoryId) return "";
    for (const root of rootCategories) {
      if (root.categoryId === defaultValues.categoryId) return root.categoryId;
      if (root.subCategories?.some((sub: any) => sub.categoryId === defaultValues.categoryId)) {
        return root.categoryId;
      }
    }
    return "";
  }, [rootCategories, defaultValues.categoryId]);
  
  const [selectedRootId, setSelectedRootId] = useState<string>("");
  
  useEffect(() => {
    if (initialRootId && !selectedRootId) setSelectedRootId(initialRootId);
  }, [initialRootId, selectedRootId]);

  const selectedRootCat = rootCategories.find(c => c.categoryId === selectedRootId);
  const subCategories = selectedRootCat?.subCategories || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control: form.control,
    name: "specs"
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateProduct(productId, data),
    onSuccess: () => {
      toast.success("Product updated successfully!");
      navigate({ to: "/admin/products" as any });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to update product");
    }
  });

  const onSubmit = (data: FormValues) => {
    // Transform specs array to Record<string, string>
    const specsRecord: Record<string, string> = {};
    data.specs.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        specsRecord[s.key.trim()] = s.value.trim();
      }
    });

    const payload = {
      productName: data.productName,
      productDescription: data.productDescription || undefined,
      productPrice: data.productPrice,
      productStock: data.productStock,
      productImage: data.productImage || undefined,
      categoryId: data.categoryId,
      brandId: data.brandId,
      compatibleVehicleIds: data.compatibleVehicleIds,
      specs: Object.keys(specsRecord).length > 0 ? specsRecord : undefined
    };

    updateMutation.mutate(payload);
  };

  const watchImageUrl = form.watch("productImage");
  const watchVehicles = form.watch("compatibleVehicleIds");

  const toggleVehicle = (id: string) => {
    const current = watchVehicles || [];
    if (current.includes(id)) {
      form.setValue("compatibleVehicleIds", current.filter(vId => vId !== id), { shouldDirty: true });
    } else {
      form.setValue("compatibleVehicleIds", [...current, id], { shouldDirty: true });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/products" as any })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Update details for {defaultValues.productName}</p>
        </div>
      </div>

      <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN - MAIN DETAILS (70%) */}
        <div className="flex-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name <span className="text-red-500">*</span></Label>
                <Input id="productName" placeholder="e.g. Amaron Pro 12V 45Ah" {...form.register("productName")} />
                {form.formState.errors.productName && <p className="text-xs text-red-500">{form.formState.errors.productName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="productDescription">Description</Label>
                <Textarea id="productDescription" placeholder="Detailed product description..." className="min-h-[120px] resize-y" {...form.register("productDescription")} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 w-full space-y-2">
                  <Label htmlFor="productImage">Image URL</Label>
                  <Input id="productImage" placeholder="https://example.com/image.jpg" {...form.register("productImage")} />
                  {form.formState.errors.productImage && <p className="text-xs text-red-500">{form.formState.errors.productImage.message}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Paste a valid URL to show a live preview.</p>
                </div>
                <div className="w-full sm:w-40 h-40 border rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center shrink-0">
                  {watchImageUrl ? (
                    <img src={watchImageUrl} alt="Preview" className="w-full h-full object-contain p-2" onError={(e) => { e.currentTarget.src = ""; e.currentTarget.className = "hidden"; }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-xs font-medium">No Image</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Technical details like voltage, capacity, terminal type.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendSpec({ key: "", value: "" })}>
                <Plus className="h-4 w-4 mr-2" /> Add Spec
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {specFields.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  No specifications added. Click "Add Spec" to start.
                </div>
              ) : (
                specFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Key (e.g. Voltage)" {...form.register(`specs.${index}.key`)} />
                      {form.formState.errors.specs?.[index]?.key && <p className="text-[10px] text-red-500">{form.formState.errors.specs[index].key?.message}</p>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Value (e.g. 12V)" {...form.register(`specs.${index}.value`)} />
                      {form.formState.errors.specs?.[index]?.value && <p className="text-[10px] text-red-500">{form.formState.errors.specs[index].value?.message}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeSpec(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - ORG & PRICING (30%) */}
        <div className="w-full lg:w-80 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productPrice">Price (₹) <span className="text-red-500">*</span></Label>
                <Input id="productPrice" type="number" min="0" step="1" {...form.register("productPrice")} />
                {form.formState.errors.productPrice && <p className="text-xs text-red-500">{form.formState.errors.productPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="productStock">Stock Quantity</Label>
                <Input id="productStock" type="number" min="0" step="1" {...form.register("productStock")} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={selectedRootId} onValueChange={(val) => {
                  setSelectedRootId(val);
                  form.setValue("categoryId", val, { shouldDirty: true, shouldValidate: true });
                }}>
                  <SelectTrigger className={form.formState.errors.categoryId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {rootCategories.map((c) => (
                      <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && !selectedRootId && <p className="text-xs text-red-500">{form.formState.errors.categoryId.message}</p>}
              </div>

              {subCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select 
                    value={form.watch("categoryId") !== selectedRootId ? form.watch("categoryId") : ""} 
                    onValueChange={(val) => form.setValue("categoryId", val, { shouldDirty: true, shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((c: any) => (
                        <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Brand <span className="text-red-500">*</span></Label>
                <Select value={form.watch("brandId")} onValueChange={(val) => form.setValue("brandId", val, { shouldDirty: true })}>
                  <SelectTrigger className={form.formState.errors.brandId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.brandId} value={b.brandId}>{b.brandName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.brandId && <p className="text-xs text-red-500">{form.formState.errors.brandId.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Compatibility</CardTitle>
              <CardDescription>Select vehicles this battery fits.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {vehicles.map((v) => (
                  <div key={v.vehicleId} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`vehicle-${v.vehicleId}`} 
                      checked={(watchVehicles || []).includes(v.vehicleId)}
                      onCheckedChange={() => toggleVehicle(v.vehicleId)}
                    />
                    <label htmlFor={`vehicle-${v.vehicleId}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {v.make} {v.model} {v.yearFrom ? `(${v.yearFrom})` : ''}
                    </label>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No vehicles available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 z-10 border-t bg-background/80 backdrop-blur-xl p-4 shadow-lg flex items-center justify-end gap-3 px-6 lg:px-8">
        <Button variant="outline" type="button" onClick={() => navigate({ to: "/admin/products" as any })}>
          Cancel
        </Button>
        <Button type="submit" form="product-form" disabled={updateMutation.isPending || !form.formState.isDirty} className="min-w-[140px]">
          {updateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
