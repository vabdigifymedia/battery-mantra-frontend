import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, useFieldArray, Controller, UseFormReturn } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery, brandsQuery, vehiclesListQuery, productDetailQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const formSchema = z.object({
  productName: z.string().min(2, "Name is required"),
  productDescription: z.string().optional(),
  productPrice: z.coerce.number().min(0, "Price must be positive"),
  originalPrice: z.coerce.number().min(0).optional(),
  exchangeDiscount: z.coerce.number().min(0).optional().default(0),
  productStock: z.coerce.number().min(0).optional(),
  productImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().uuid("Category is required"),
  brandId: z.string().uuid("Brand is required"),
  compatibleVehicleIds: z.array(z.string().uuid()).default([]),
  specs: z.array(z.object({
    groupName: z.string().min(1, "Group name is required"),
    items: z.array(z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Value is required")
    })).default([])
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
    originalPrice: Number(product.specs?.originalPrice || 0),
    exchangeDiscount: product.exchangeDiscount || 0,
    productStock: product.productStock || 0,
    productImage: product.productImage || "",
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    compatibleVehicleIds: product.compatibleVehicles?.map(v => v.vehicleId) || [],
    specs: product.specs
      ? (() => {
          const entries = Object.entries(product.specs);
          // Check if it's already grouped (nested objects) or flat
          const hasNestedObjects = entries.some(
            ([, v]) => typeof v === "object" && v !== null && !Array.isArray(v)
          );
          if (hasNestedObjects) {
            // Already grouped format
            return entries
              .filter(([, v]) => typeof v === "object" && v !== null && !Array.isArray(v))
              .map(([groupName, groupSpecs]) => ({
                groupName,
                items: Object.entries(groupSpecs as Record<string, unknown>).map(([key, value]) => ({
                  key,
                  value: String(value),
                })),
              }));
          } else {
            // Old flat format — put all under "General" group
            return [{
              groupName: "General",
              items: entries.map(([key, value]) => ({ key, value: String(value) })),
            }];
          }
        })()
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
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  const { fields: specGroups, append: appendGroup, remove: removeGroup } = useFieldArray({
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
    // Transform grouped specs into nested Record
    const specsRecord: Record<string, Record<string, string>> = {};
    data.specs.forEach(group => {
      if (!group.groupName.trim()) return;
      const groupSpecs: Record<string, string> = {};
      group.items.forEach(item => {
        if (item.key.trim() && item.value.trim()) {
          groupSpecs[item.key.trim()] = item.value.trim();
        }
      });
      if (Object.keys(groupSpecs).length > 0) {
        specsRecord[group.groupName.trim()] = groupSpecs;
      }
    });

    if (data.originalPrice && data.originalPrice > 0) {
      specsRecord["originalPrice"] = data.originalPrice.toString() as any;
    }

    const payload = {
      productName: data.productName,
      productDescription: data.productDescription || undefined,
      productPrice: data.productPrice,
      exchangeDiscount: data.exchangeDiscount,
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

      <form id="product-form" onSubmit={form.handleSubmit(onSubmit as any, (errs) => {
        console.error("Validation Errors:", errs);
        toast.error("Please check the form for errors.");
      })} className="flex flex-col lg:flex-row gap-6">
        
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
                <Controller
                  name="productDescription"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Detailed product description..."
                    />
                  )}
                />
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
                <CardDescription>Group specs under headings like "Warranty Terms", "Technical Details", etc.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendGroup({ groupName: "", items: [{ key: "", value: "" }] })}>
                <Plus className="h-4 w-4 mr-2" /> Add Group
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {specGroups.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  No specifications added. Click "Add Group" to start.
                </div>
              ) : (
                specGroups.map((group, groupIndex) => (
                  <SpecGroupEditor
                    key={group.id}
                    form={form}
                    groupIndex={groupIndex}
                    onRemoveGroup={() => removeGroup(groupIndex)}
                  />
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
                <Label htmlFor="productPrice">Selling Price (₹) <span className="text-red-500">*</span></Label>
                <Input id="productPrice" type="number" min="0" step="1" {...form.register("productPrice")} />
                {form.formState.errors.productPrice && <p className="text-xs text-red-500">{form.formState.errors.productPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price / MRP (₹)</Label>
                <Input id="originalPrice" type="number" min="0" step="1" {...form.register("originalPrice")} />
                <p className="text-xs text-muted-foreground">Strikethrough price. Leave 0 if none.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeDiscount">Exchange Discount (₹)</Label>
                <Input id="exchangeDiscount" type="number" min="0" step="1" {...form.register("exchangeDiscount")} />
                <p className="text-xs text-muted-foreground">Set to 0 if exchange is not applicable for this battery.</p>
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
              <Tabs defaultValue="CAR" className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto gap-1 bg-muted/50 p-1 w-full justify-start">
                  {Object.keys(
                    vehicles.reduce((acc, v) => {
                      const type = v.vehicleType || "CAR";
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(v);
                      return acc;
                    }, {} as Record<string, typeof vehicles>)
                  ).map(type => (
                    <TabsTrigger key={type} value={type} className="rounded-md text-xs px-3">{type}</TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(
                  vehicles.reduce((acc, v) => {
                    const type = v.vehicleType || "CAR";
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(v);
                    return acc;
                  }, {} as Record<string, typeof vehicles>)
                ).map(([type, typeVehicles]) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {typeVehicles.map((v) => (
                        <div key={v.vehicleId} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`vehicle-${v.vehicleId}`} 
                            checked={(watchVehicles || []).includes(v.vehicleId)}
                            onCheckedChange={() => toggleVehicle(v.vehicleId)}
                          />
                          <label htmlFor={`vehicle-${v.vehicleId}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            {v.make} {v.model}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
                {vehicles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No vehicles available.</p>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 z-10 border-t bg-background/80 backdrop-blur-xl p-4 shadow-lg flex items-center justify-end gap-3 px-6 lg:px-8">
        <Button variant="outline" type="button" onClick={() => navigate({ to: "/admin/products" as any })}>
          Cancel
        </Button>
        <Button type="submit" form="product-form" disabled={updateMutation.isPending} className="min-w-[140px]">
          {updateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function SpecGroupEditor({
  form,
  groupIndex,
  onRemoveGroup,
}: {
  form: any;
  groupIndex: number;
  onRemoveGroup: () => void;
}) {
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: `specs.${groupIndex}.items` as const,
  });

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border rounded-lg bg-muted/20 overflow-hidden">
      {/* Group Header */}
      <div className="flex items-center gap-2 p-3 bg-muted/40 border-b">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          <Input
            placeholder="Group Name (e.g. Warranty Terms, Technical Details)"
            className="bg-background font-medium"
            {...form.register(`specs.${groupIndex}.groupName`)}
          />
          {form.formState.errors.specs?.[groupIndex]?.groupName && (
            <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.specs[groupIndex]?.groupName?.message}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{itemFields.length} specs</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8"
          onClick={onRemoveGroup}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Group Items */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {itemFields.map((item, itemIndex) => (
            <div key={item.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Key (e.g. Free Replacement)"
                  className="text-sm"
                  {...form.register(`specs.${groupIndex}.items.${itemIndex}.key`)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Value (e.g. 36 Months)"
                  className="text-sm"
                  {...form.register(`specs.${groupIndex}.items.${itemIndex}.value`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0 h-9 w-9"
                onClick={() => removeItem(itemIndex)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
            onClick={() => appendItem({ key: "", value: "" })}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Spec
          </Button>
        </div>
      )}
    </div>
  );
}
