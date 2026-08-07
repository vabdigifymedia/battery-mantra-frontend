import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, useFieldArray, Controller, UseFormReturn } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rootCategoriesQuery, brandsQuery, vehiclesListQuery, productDetailQuery, productListQuery, capacitiesQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { locationService } from "@/services/location.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, ChevronDown, ChevronRight, ShieldCheck, Battery, Zap, Activity, Wrench, Box, Gauge, Sparkles, Award, Clock, Truck, Flame, Cpu, CheckCircle2, RefreshCw, PiggyBank } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { SpecGroupDto, SpecAttributeDto, SpecUnitDto } from "@/types/dto";
import { applySeoTemplate } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client";

const AVAILABLE_ICONS = [
  { id: "ShieldCheck", icon: ShieldCheck, label: "Shield" },
  { id: "Battery", icon: Battery, label: "Battery" },
  { id: "Zap", icon: Zap, label: "Zap" },
  { id: "Activity", icon: Activity, label: "Activity" },
  { id: "Wrench", icon: Wrench, label: "Wrench" },
  { id: "Box", icon: Box, label: "Box" },
  { id: "Gauge", icon: Gauge, label: "Gauge" },
  { id: "Sparkles", icon: Sparkles, label: "Sparkle" },
  { id: "Award", icon: Award, label: "Award" },
  { id: "Clock", icon: Clock, label: "Clock" },
  { id: "Truck", icon: Truck, label: "Truck" },
  { id: "Flame", icon: Flame, label: "Flame" },
  { id: "Cpu", icon: Cpu, label: "CPU" },
  { id: "RefreshCw", icon: RefreshCw, label: "Cycle" },
  { id: "PiggyBank", icon: PiggyBank, label: "Savings" },
  { id: "CheckCircle2", icon: CheckCircle2, label: "Check" }
];

const formSchema = z.object({
  productName: z.string().min(2, "Name is required"),
  productDescription: z.string().optional(),
  productPrice: z.coerce.number().min(0, "Price must be positive"),
  originalPrice: z.coerce.number().min(0).optional().default(0),
  exchangeDiscount: z.coerce.number().min(0).optional().default(0),
  productStock: z.coerce.number().min(0).optional().default(0),
  productImage: z.string().min(1, "Primary image URL is required"),
  additionalImages: z.array(z.object({
    url: z.string().url("Must be a valid URL")
  })).default([]),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  capacity: z.string().optional(),
  specUnitIds: z.record(z.string(), z.string()).default({}),
  highlightedSpecAttributeIds: z.array(z.string()).default([]),
  specAttributeIcons: z.record(z.string(), z.string()).default({}),
  isAutoAssignToPartner: z.boolean().default(true),
  seo: z.object({
    slug: z.string().nullish(),
    metaTitle: z.string().nullish(),
    metaDescription: z.string().nullish(),
    metaKeywords: z.string().nullish(),
    metaTitleCity: z.string().nullish(),
    metaDescriptionCity: z.string().nullish(),
    metaKeywordsCity: z.string().nullish(),
    ogTitle: z.string().nullish(),
    ogDescription: z.string().nullish(),
    ogTitleCity: z.string().nullish(),
    ogDescriptionCity: z.string().nullish(),
    canonicalUrl: z.string().nullish(),
  }).optional().default({})
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

  // Build specUnitIds from specDetails so saved specs pre-fill in the edit form
  // specDetails contains: { unitId, attributeId, value, ... }
  // We need a map of { [attributeId]: unitId } for each saved spec
  const savedSpecUnitIds: Record<string, string> = {};
  if (product.specDetails && Array.isArray(product.specDetails)) {
    for (const detail of product.specDetails) {
      if (detail.attributeId && detail.unitId) {
        savedSpecUnitIds[detail.attributeId] = detail.unitId;
      }
    }
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
    additionalImages: product.additionalImages?.map(url => ({ url })) || [],
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    capacity: product.capacity || "",
    specUnitIds: savedSpecUnitIds,
    highlightedSpecAttributeIds: product.highlightedSpecAttributeIds || [],
    specAttributeIcons: product.specAttributeIcons || {},
    isAutoAssignToPartner: product.isAutoAssignToPartner !== false,
    seo: {
      slug: product.seo?.slug || (product.specs?.seo as any)?.slug || "",
      metaTitle: product.seo?.metaTitle || (product.specs?.seo as any)?.metaTitle || "",
      metaDescription: product.seo?.metaDescription || (product.specs?.seo as any)?.metaDescription || "",
      metaKeywords: product.seo?.metaKeywords || (product.specs?.seo as any)?.metaKeywords || "",
      metaTitleCity: product.seo?.metaTitleCity || (product.specs?.seo as any)?.metaTitleCity || "",
      metaDescriptionCity: product.seo?.metaDescriptionCity || (product.specs?.seo as any)?.metaDescriptionCity || "",
      metaKeywordsCity: product.seo?.metaKeywordsCity || (product.specs?.seo as any)?.metaKeywordsCity || "",
      ogTitle: product.seo?.ogTitle || (product.specs?.seo as any)?.ogTitle || "",
      ogDescription: product.seo?.ogDescription || (product.specs?.seo as any)?.ogDescription || "",
      ogTitleCity: product.seo?.ogTitleCity || (product.specs?.seo as any)?.ogTitleCity || "",
      ogDescriptionCity: product.seo?.ogDescriptionCity || (product.specs?.seo as any)?.ogDescriptionCity || "",
      canonicalUrl: product.seo?.canonicalUrl || (product.specs?.seo as any)?.canonicalUrl || "",
    }
  };

  return <EditProductForm productId={productId} defaultValues={defaultValues} />;
}

function EditProductForm({ productId, defaultValues }: { productId: string; defaultValues: FormValues }) {
  const navigate = useNavigate();
  const { data: rootCategories = [] } = useQuery(rootCategoriesQuery());
  const { data: brands = [] } = useQuery(brandsQuery());
  const { data: cities = [] } = useQuery({ queryKey: ["admin", "cities"], queryFn: () => locationService.getAllCities() });
  const queryClient = useQueryClient();


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
  
  const { data: templates } = useQuery({
    queryKey: ["seo", "templates"],
    queryFn: () => apiFetch<any[]>("/api/seo/templates"),
  });
  
  const [selectedRootId, setSelectedRootId] = useState<string>("");
  const { data: dbCapacities = [] } = useQuery(capacitiesQuery(selectedRootId || undefined));
  
  useEffect(() => {
    if (initialRootId && !selectedRootId) {
      setSelectedRootId(initialRootId);
    }
  }, [initialRootId, selectedRootId]);

  const selectedRootCategory = rootCategories.find(c => c.categoryId === selectedRootId);
  
  const subCategories = selectedRootCategory?.subCategories || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  // Ensure categoryId and brandId stay synced — fixes race condition where
  // controlled Select value transitions (empty → valid) can wipe form values
  useEffect(() => {
    const syncField = (field: "categoryId" | "brandId") => {
      const current = form.getValues(field);
      if (!current && defaultValues[field]) {
        form.setValue(field, defaultValues[field], { shouldValidate: false });
      }
    };
    syncField("categoryId");
    syncField("brandId");
  });

  // Pre-fill SEO fields from global templates if they are empty
  useEffect(() => {
    if (templates && templates.length > 0 && brands.length > 0 && rootCategories.length > 0) {
      const templateWithoutCity = templates.find((t: any) => t.templateType === "PRODUCT_WITHOUT_CITY");
      const templateWithCity = templates.find((t: any) => t.templateType === "PRODUCT_WITH_CITY");
      
      const seoData = form.getValues("seo");
      const context = {
        product_name: defaultValues.productName || "",
        brand_name: brands.find(b => b.brandId === defaultValues.brandId)?.brandName || "",
        category_name: rootCategories.find(c => c.categoryId === defaultValues.categoryId)?.categoryName || "",
        delivery_time: "2 Hours"
      };
      
      let shouldUpdate = false;
      const newSeo = { ...seoData };
      
      if (templateWithoutCity) {
        if (!seoData.metaTitle && templateWithoutCity.seoTitleTemplate) {
          newSeo.metaTitle = applySeoTemplate(templateWithoutCity.seoTitleTemplate, context);
          shouldUpdate = true;
        }
        if (!seoData.metaDescription && templateWithoutCity.seoDescriptionTemplate) {
          newSeo.metaDescription = applySeoTemplate(templateWithoutCity.seoDescriptionTemplate, context);
          shouldUpdate = true;
        }
        if (!seoData.metaKeywords && templateWithoutCity.seoKeywordsTemplate) {
          newSeo.metaKeywords = applySeoTemplate(templateWithoutCity.seoKeywordsTemplate, context);
          shouldUpdate = true;
        }
        if (!seoData.ogTitle && templateWithoutCity.ogTitleTemplate) {
          newSeo.ogTitle = applySeoTemplate(templateWithoutCity.ogTitleTemplate, context);
          shouldUpdate = true;
        }
        if (!seoData.ogDescription && templateWithoutCity.ogDescriptionTemplate) {
          newSeo.ogDescription = applySeoTemplate(templateWithoutCity.ogDescriptionTemplate, context);
          shouldUpdate = true;
        }
      }

      if (templateWithCity) {
        if (!seoData.metaTitleCity && templateWithCity.seoTitleTemplate) {
          newSeo.metaTitleCity = applySeoTemplate(templateWithCity.seoTitleTemplate, context);
          shouldUpdate = true;
        }
        if (!seoData.metaDescriptionCity && templateWithCity.seoDescriptionTemplate) {
          newSeo.metaDescriptionCity = applySeoTemplate(templateWithCity.seoDescriptionTemplate, context);
          shouldUpdate = true;
        }
        if (!seoData.metaKeywordsCity && templateWithCity.seoKeywordsTemplate) {
          newSeo.metaKeywordsCity = applySeoTemplate(templateWithCity.seoKeywordsTemplate, context);
          shouldUpdate = true;
        }
      }
      
      if (shouldUpdate) {
        form.setValue("seo", newSeo, { shouldDirty: false });
      }
    }
  }, [templates, brands.length, rootCategories.length]);

  const categoryId = form.watch("categoryId");
  const { data: specTemplate, isLoading: isSpecLoading } = useQuery({
    queryKey: ["admin", "specs", "template", categoryId],
    queryFn: () => adminService.getCategorySpecTemplate(categoryId),
    enabled: !!categoryId,
  });

  const { fields: additionalImageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "additionalImages"
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateProduct(productId, data),
    onSuccess: () => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate({ to: "/admin/products" as any });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to update product");
    }
  });

  const onSubmit = async (data: FormValues) => {
    // Duplicate Product Check
    try {
      const allProducts = await queryClient.fetchQuery(productListQuery());
      if (allProducts) {
        const isDuplicate = allProducts.some(
          p => p.productId !== productId && p.productName.toLowerCase().trim() === data.productName.toLowerCase().trim()
        );
        if (isDuplicate) {
          toast.error(`A product named "${data.productName}" already exists!`);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to fetch products for duplicate check", e);
    }

    const specUnitIdsList = Object.values(data.specUnitIds).filter(Boolean);

    const payload = {
      productName: data.productName,
      productDescription: data.productDescription || undefined,
      productPrice: data.productPrice,
      originalPrice: data.originalPrice || 0,
      exchangeDiscount: data.exchangeDiscount || 0,
      productStock: data.productStock,
      productImage: data.productImage || undefined,
      additionalImages: data.additionalImages.length > 0 ? data.additionalImages.map(img => img.url).filter(Boolean) : undefined,
      categoryId: data.categoryId,
      brandId: data.brandId,
      capacity: data.capacity || undefined,
      specUnitIds: specUnitIdsList.length > 0 ? specUnitIdsList : undefined,
      highlightedSpecAttributeIds: data.highlightedSpecAttributeIds.length > 0 ? data.highlightedSpecAttributeIds : undefined,
      specAttributeIcons: Object.keys(data.specAttributeIcons).length > 0 ? data.specAttributeIcons : undefined,
      isAutoAssignToPartner: data.isAutoAssignToPartner,
      seo: data.seo
    };

    updateMutation.mutate(payload);
  };

  const watchImageUrl = form.watch("productImage");
  const watchedSpecUnitIds = form.watch("specUnitIds") || {};
  const watchedSpecAttributeIcons = form.watch("specAttributeIcons") || {};
  const watchedHighlightedIds = form.watch("highlightedSpecAttributeIds") || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
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
        // Auto-recover from categoryId/brandId race condition
        let recovered = false;
        if (errs.categoryId && defaultValues.categoryId) {
          form.setValue("categoryId", defaultValues.categoryId, { shouldValidate: true });
          recovered = true;
        }
        if (errs.brandId && defaultValues.brandId) {
          form.setValue("brandId", defaultValues.brandId, { shouldValidate: true });
          recovered = true;
        }
        if (recovered) {
          // Re-trigger submit after recovery
          setTimeout(() => form.handleSubmit(onSubmit as any)(), 100);
          return;
        }
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
              {dbCapacities.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="capacity">R/L Code</Label>
                  <Select value={form.watch("capacity") || "none"} onValueChange={(val) => form.setValue("capacity", val === "none" ? "" : val, { shouldDirty: true, shouldValidate: true })}>
                    <SelectTrigger className={form.formState.errors.capacity ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select an R/L code (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Leave Blank)</SelectItem>
                      {dbCapacities.map((cap) => (
                        <SelectItem key={cap.capacityId} value={cap.capacityName}>{cap.capacityName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select the exact R/L code. Vehicles matching this code will automatically be listed as compatible.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="productDescription">Description</Label>
                <Controller
                  name="productDescription"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Detailed product description..."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        You can use dynamic variables like <code className="bg-muted px-1 rounded">{`{city_name}`}</code>, <code className="bg-muted px-1 rounded">{`{product_name}`}</code>, <code className="bg-muted px-1 rounded">{`{brand_name}`}</code>, <code className="bg-muted px-1 rounded">{`{category_name}`}</code>, <code className="bg-muted px-1 rounded">{`{manufacturer_name}`}</code> which will be automatically replaced on the frontend based on the user's location and product context.
                      </p>
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Media</CardTitle>
                <CardDescription>Main image and additional gallery images.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendImage({ url: "" })}>
                <Plus className="h-4 w-4 mr-2" /> Add Image
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 w-full space-y-2">
                  <Controller
                    control={form.control}
                    name="productImage"
                    render={({ field }) => (
                      <CloudinaryUpload
                        value={field.value}
                        onChange={field.onChange}
                        folder="battery-mantra/products"
                        label="Primary Image *"
                        error={form.formState.errors.productImage?.message}
                      />
                    )}
                  />
                </div>
              </div>

              {additionalImageFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label>Additional Images</Label>
                  {additionalImageFields.map((field, idx) => {
                    const imgUrl = form.watch(`additionalImages.${idx}.url`);
                    return (
                      <div key={field.id} className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                          <Controller
                            control={form.control}
                            name={`additionalImages.${idx}.url` as const}
                            render={({ field }) => (
                              <CloudinaryUpload
                                value={field.value}
                                onChange={field.onChange}
                                folder="battery-mantra/products"
                                label={`Additional Image ${idx + 1}`}
                                error={form.formState.errors.additionalImages?.[idx]?.url?.message}
                              />
                            )}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-8" onClick={() => removeImage(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Select values and highlight up to 6 key features with custom icons.</CardDescription>
              </div>
              <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                Highlighted: {form.watch("highlightedSpecAttributeIds").length} / 6
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!categoryId ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  Select a category to load specifications.
                </div>
              ) : isSpecLoading ? (
                <div className="text-center py-6 text-sm text-muted-foreground">Loading specifications...</div>
              ) : !specTemplate || specTemplate.specGroups.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  No specifications configured for this category.
                </div>
              ) : (
                specTemplate.specGroups.map((group: SpecGroupDto) => (
                  <div key={group.specCategoryId} className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-1">{group.specCategoryName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.attributes.map((attr: SpecAttributeDto) => {
                        const isHighlighted = watchedHighlightedIds.includes(attr.attributeId);
                        const highlightedCount = watchedHighlightedIds.length;
                        return (
                        <div key={attr.attributeId} className="space-y-3 p-3 border rounded-lg bg-background">
                          <div className="flex items-start justify-between gap-2">
                            <Label className="font-semibold text-sm line-clamp-2 flex-1 leading-snug">{attr.attributeName}</Label>
                            <div className="flex items-center gap-2 shrink-0">
                              <Label htmlFor={`highlight-${attr.attributeId}`} className="text-xs text-muted-foreground cursor-pointer">Highlight</Label>
                              <Checkbox 
                                id={`highlight-${attr.attributeId}`}
                                checked={isHighlighted}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues("highlightedSpecAttributeIds") || [];
                                  if (checked) {
                                    if (current.length >= 6) {
                                      toast.warning("Maximum 6 key features can be highlighted.");
                                      return;
                                    }
                                    form.setValue("highlightedSpecAttributeIds", [...current, attr.attributeId], { shouldDirty: true });
                                  } else {
                                    form.setValue("highlightedSpecAttributeIds", current.filter(id => id !== attr.attributeId), { shouldDirty: true });
                                    const icons = { ...form.getValues("specAttributeIcons") };
                                    delete icons[attr.attributeId];
                                    form.setValue("specAttributeIcons", icons, { shouldDirty: true });
                                  }
                                }}
                                disabled={!isHighlighted && highlightedCount >= 6}
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 items-start">
                            <div className="flex-1 min-w-0">
                              <Select
                                value={watchedSpecUnitIds[attr.attributeId] || ""}
                                onValueChange={(val) => {
                                  const currentUnits = { ...form.getValues("specUnitIds") };
                                  if (val === "none") {
                                    delete currentUnits[attr.attributeId];
                                  } else {
                                    currentUnits[attr.attributeId] = val;
                                  }
                                  form.setValue("specUnitIds", currentUnits, { shouldDirty: true });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <div className="truncate text-left w-full">
                                    <SelectValue placeholder={`Select...`} />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">-- None --</SelectItem>
                                  {attr.availableUnits.map((unit: SpecUnitDto) => (
                                    <SelectItem key={unit.unitId} value={unit.unitId}>
                                      {unit.unitValue}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {isHighlighted && (
                              <div className="w-[90px] sm:w-[110px] shrink-0">
                                <Select
                                  value={watchedSpecAttributeIcons[attr.attributeId] || ""}
                                  onValueChange={(val) => {
                                    const icons = { ...form.getValues("specAttributeIcons") };
                                    if (val === "none") {
                                      delete icons[attr.attributeId];
                                    } else {
                                      icons[attr.attributeId] = val;
                                    }
                                    form.setValue("specAttributeIcons", icons, { shouldDirty: true });
                                  }}
                                >
                                  <SelectTrigger className="px-2 w-full">
                                    <SelectValue placeholder="Icon..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Auto</SelectItem>
                                    {AVAILABLE_ICONS.map((IconObj) => {
                                      const IconComp = IconObj.icon;
                                      return (
                                        <SelectItem key={IconObj.id} value={IconObj.id}>
                                          <div className="flex items-center gap-2">
                                            <IconComp className="h-4 w-4" />
                                            <span className="text-xs">{IconObj.label}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
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
                <Label htmlFor="exchangeDiscount">Price Old Item (Rs.)</Label>
                <Input id="exchangeDiscount" type="number" min="0" step="1" {...form.register("exchangeDiscount")} placeholder="Exchange discount" />
                <p className="text-[10px] text-muted-foreground mt-1">Discount amount for old battery (Scrap Value).</p>
                {form.formState.errors.exchangeDiscount && <p className="text-xs text-red-500">{form.formState.errors.exchangeDiscount.message}</p>}
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

              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <Controller
                  control={form.control}
                  name="isAutoAssignToPartner"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <div className="space-y-1 leading-none">
                  <Label>Auto-Assign Order to Partner</Label>
                  <p className="text-[12px] text-muted-foreground">
                    When checked, orders for this product will be automatically forwarded to the local partner based on the customer's city. If unchecked, the admin must manually transfer it.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Information</CardTitle>
              <CardDescription>Configure search engine optimization for this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product URL (Slug) <span className="text-muted-foreground font-normal ml-2">Leave blank to auto-generate from name</span></Label>
                <Input placeholder="e.g., exide-mileage-ml38b20l-battery" {...form.register("seo.slug")} />
              </div>
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input placeholder="Buy Exide Mileage ML38B20L 35Ah Car Battery at Best Price | Batterymantra.com" {...form.register("seo.metaTitle")} />
              </div>
              <div className="space-y-2">
                <Label>Search / SEO Keywords</Label>
                <Input placeholder="Exide Car Battery MI38B20L, Exide 35Ah Car battery..." {...form.register("seo.metaKeywords")} />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Input placeholder="Buy Exide Mileage ML38B20L 35Ah Car Battery At Best Price | Cash On Delivery..." {...form.register("seo.metaDescription")} />
              </div>
              <div className="space-y-2 mt-4">
                <Label>SEO Title City <span className="text-muted-foreground font-normal">(Name code : delivery_time, city_name)</span></Label>
                <Input placeholder="Exide Mileage ML38B20L 35Ah Car Battery Price in city_name | Batterymantra.com" {...form.register("seo.metaTitleCity")} />
              </div>
              <div className="space-y-2">
                <Label>SEO Keywords City <span className="text-muted-foreground font-normal">(Name code : delivery_time, city_name)</span></Label>
                <Input placeholder="Exide Mileage ML38B20L 35Ah Car Battery At Best Price in city_name" {...form.register("seo.metaKeywordsCity")} />
              </div>
              <div className="space-y-2">
                <Label>SEO Description City <span className="text-muted-foreground font-normal">(Name code : delivery_time, city_name)</span></Label>
                <Input placeholder="Buy Exide Mileage ML38B20L 35Ah Car Battery At Best Price in city_name | 100% genuine..." {...form.register("seo.metaDescriptionCity")} />
              </div>
              <div className="space-y-2 mt-4">
                <Label>OG Title</Label>
                <Input placeholder="Buy Exide Mileage ML38B20L 35Ah Car Battery at Best Price | Batterymantra.com" {...form.register("seo.ogTitle")} />
              </div>
              <div className="space-y-2">
                <Label>OG Description</Label>
                <Input placeholder="Buy Exide Mileage ML38B20L 35Ah Car Battery At Best Price | Cash On Delivery..." {...form.register("seo.ogDescription")} />
              </div>
              <div className="space-y-2 mt-4">
                <Label>OG Title City <span className="text-muted-foreground font-normal">(Name code : delivery_time, city_name)</span></Label>
                <Input placeholder="Exide Mileage ML38B20L 35Ah Car Battery Price in city_name | Batterymantra.com" {...form.register("seo.ogTitleCity")} />
              </div>
              <div className="space-y-2">
                <Label>OG Description City <span className="text-muted-foreground font-normal">(Name code : delivery_time, city_name)</span></Label>
                <Input placeholder="Buy Exide Mileage ML38B20L 35Ah Car Battery At Best Price in city_name | 100% genuine..." {...form.register("seo.ogDescriptionCity")} />
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
        <Button type="submit" form="product-form" disabled={updateMutation.isPending} className="min-w-[140px]">
          {updateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

