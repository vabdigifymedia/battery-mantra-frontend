import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rootCategoriesQuery,
  brandsQuery,
  capacitiesQuery,
  productListQuery,
} from "@/queries";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/feedback/Spinner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useFormDraft } from "@/hooks/useFormDraft";
import { FormDraftBanner } from "@/components/forms/FormDraftBanner";
import { generateSlug } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/image/cdn";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Battery,
  Zap,
  Car,
  ShieldCheck,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Package,
  Search,
  Clock,
  Activity,
  Wrench,
  Box,
  Gauge,
  Award,
  Truck,
  Flame,
  Cpu,
  RefreshCw,
  PiggyBank,
} from "lucide-react";
import type { CityDto, SpecGroupDto, SpecAttributeDto, SpecUnitDto } from "@/types/dto";

type ProductFormMode = "AUTOMOTIVE" | "STATIONARY_BATTERY" | "APPLIANCE";

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
  { id: "CheckCircle2", icon: CheckCircle2, label: "Check" },
];

const WARRANTY_PRESETS = [
  "18 Months",
  "24 Months",
  "36 Months",
  "48 Months (24F + 24P)",
  "60 Months (36F + 24P)",
  "72 Months",
];

const AUTOMOTIVE_AH_PRESETS = ["32Ah", "35Ah", "38Ah", "44Ah", "50Ah", "65Ah", "80Ah", "100Ah"];
const STATIONARY_AH_PRESETS = ["100Ah", "135Ah", "150Ah", "180Ah", "200Ah", "220Ah", "250Ah"];
const STATIONARY_TYPES = ["Tall Tubular", "Short Tubular", "Jumbo Tubular", "Flat Plate", "SMF / VRLA", "Solar Tubular"];
const APPLIANCE_VA_PRESETS = ["700VA", "900VA", "1100VA", "1500VA", "2kVA", "3.5kVA", "5kVA"];
const APPLIANCE_SYSTEMS = ["12V Single Battery", "24V Double Battery", "48V 4-Battery", "Pure Sine Wave", "Digital Square Wave"];

function detectCategoryMode(categoryName?: string, hasCapacitiesFromApi?: boolean): ProductFormMode {
  const name = (categoryName || "").toLowerCase();
  if (!name) {
    return hasCapacitiesFromApi ? "AUTOMOTIVE" : "STATIONARY_BATTERY";
  }
  if (/(inverter\s*batter|tall\s*tubular|tubular|solar\s*batter|ups\s*batter|smf|vrla|genset|lithium\s*batter)/i.test(name)) {
    return "STATIONARY_BATTERY";
  }
  if (!/batter/i.test(name) && /(inverter|ups|stabilizer|charger|solar\s*panel|accessor|trolley)/i.test(name)) {
    return "APPLIANCE";
  }
  if (/(car|bike|two[\s-]*wheeler|scooter|motorcycle|commercial|truck|tractor|bus|three[\s-]*wheeler|e[\s-]*rickshaw|automotive|vehicle|suv)/i.test(name) || hasCapacitiesFromApi) {
    return "AUTOMOTIVE";
  }
  if (/batter/i.test(name)) {
    return "STATIONARY_BATTERY";
  }
  return "APPLIANCE";
}

const formSchema = z.object({
  productName: z.string().min(2, "Product name is required (min 2 characters)"),
  categoryId: z.string().min(1, "Please select a category"),
  brandId: z.string().min(1, "Please select a brand"),
  suggestedBrandName: z.string().optional(),
  productPrice: z.coerce.number().min(1, "Selling price must be greater than ₹0"),
  originalPrice: z.coerce.number().min(0).optional().default(0),
  exchangeDiscount: z.coerce.number().min(0).optional().default(0),
  branchStock: z.coerce.number().min(0).optional().default(10),
  branchCityId: z.string().optional(),
  capacity: z.string().optional(),
  powerOrAhRating: z.string().optional(),
  batteryType: z.string().optional(),
  warranty: z.string().optional(),
  productImage: z.string().min(1, "Primary product photo is required"),
  additionalImages: z.array(z.object({ url: z.string() })).default([]),
  productDescription: z.string().optional(),
  highlights: z.string().optional(),
  searchKeywords: z.string().optional(),
  proposalReason: z.string().min(5, "Please explain briefly why Admin should approve this product"),
  specUnitIds: z.record(z.string(), z.string()).default({}),
  highlightedSpecAttributeIds: z.array(z.string()).default([]),
  specAttributeIcons: z.record(z.string(), z.string()).default({}),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/kalkaji_/partner/products/request")({
  component: PartnerRequestProductPage,
});

function PartnerRequestProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRootId, setSelectedRootId] = useState<string>("");
  const [manualModeOverride, setManualModeOverride] = useState<ProductFormMode | null>(null);
  const [manualRlCodeEntry, setManualRlCodeEntry] = useState(false);

  // Core Queries
  const { data: rootCategories = [] } = useQuery(rootCategoriesQuery());
  const { data: brands = [] } = useQuery(brandsQuery());
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: ({ signal }) => partnerDashboardService.getMyProfile(signal),
  });

  const operatingCities: CityDto[] = useMemo(
    () => partnerProfile?.operatingCities || [],
    [partnerProfile?.operatingCities]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      productName: "",
      categoryId: "",
      brandId: "",
      suggestedBrandName: "",
      productPrice: 0,
      originalPrice: 0,
      exchangeDiscount: 0,
      branchStock: 10,
      branchCityId: "",
      capacity: "",
      powerOrAhRating: "",
      batteryType: "",
      warranty: "",
      productImage: "",
      additionalImages: [],
      productDescription: "",
      highlights: "",
      searchKeywords: "",
      proposalReason: "",
      specUnitIds: {},
      highlightedSpecAttributeIds: [],
      specAttributeIcons: {},
    },
  });

  // Set default operating city once profile loads
  useEffect(() => {
    if (operatingCities.length > 0 && !form.getValues("branchCityId")) {
      form.setValue("branchCityId", operatingCities[0].cityId);
    }
  }, [operatingCities, form]);

  const categoryId = form.watch("categoryId");
  const brandId = form.watch("brandId");
  const watchName = form.watch("productName");
  const watchPrice = Number(form.watch("productPrice") || 0);
  const watchMrp = Number(form.watch("originalPrice") || 0);
  const watchExchange = Number(form.watch("exchangeDiscount") || 0);
  const watchImage = form.watch("productImage");
  const watchWarranty = form.watch("warranty");
  const watchCapacity = form.watch("capacity");
  const watchPowerOrAh = form.watch("powerOrAhRating");
  const watchBatteryType = form.watch("batteryType");
  const watchProposalReason = form.watch("proposalReason");
  const watchBranchCityId = form.watch("branchCityId");
  const watchedSpecUnitIds = form.watch("specUnitIds") || {};
  const watchedSpecAttributeIcons = form.watch("specAttributeIcons") || {};
  const watchedHighlightedIds = form.watch("highlightedSpecAttributeIds") || [];

  const selectedRootCat = useMemo(
    () => rootCategories.find((c) => c.categoryId === selectedRootId),
    [rootCategories, selectedRootId]
  );
  const subCategories = selectedRootCat?.subCategories || [];
  const activeSubCat = subCategories.find((s) => s.categoryId === categoryId);
  const activeCategoryName = activeSubCat?.categoryName || selectedRootCat?.categoryName || "";

  // R/L Code capacities query (public endpoint, scoped to selected root category)
  const { data: dbCapacities = [] } = useQuery(capacitiesQuery(selectedRootId || undefined));

  // Smart Category Mode (auto-detected + manual override)
  const detectedMode = useMemo(
    () => detectCategoryMode(activeCategoryName, dbCapacities.length > 0),
    [activeCategoryName, dbCapacities.length]
  );
  const activeMode: ProductFormMode = manualModeOverride || detectedMode;

  // Attempt to load category spec template (gracefully falls back to null if partner endpoint not open yet)
  const { data: specTemplate, isLoading: isSpecLoading } = useQuery({
    queryKey: ["partner", "specs", "template", categoryId],
    queryFn: ({ signal }) => partnerDashboardService.getCategorySpecTemplate(categoryId, signal),
    enabled: !!categoryId,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const { data: parentSpecTemplate, isLoading: isParentSpecLoading } = useQuery({
    queryKey: ["partner", "specs", "template", selectedRootId],
    queryFn: ({ signal }) => partnerDashboardService.getCategorySpecTemplate(selectedRootId, signal),
    enabled: !!selectedRootId && selectedRootId !== categoryId,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const effectiveSpecTemplate =
    specTemplate?.specGroups && specTemplate.specGroups.length > 0
      ? specTemplate
      : parentSpecTemplate;

  const isSpecLoadingEffective =
    isSpecLoading ||
    (!!selectedRootId && selectedRootId !== categoryId && !specTemplate?.specGroups?.length && isParentSpecLoading);

  const {
    fields: additionalImageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: "additionalImages",
  });

  // Draft recovery
  const draft = useFormDraft("partner_product_request", form.watch(), (data) => {
    form.reset(data);
    if (data.categoryId) {
      const rootMatch = rootCategories.find(
        (r) =>
          r.categoryId === data.categoryId ||
          r.subCategories?.some((s) => s.categoryId === data.categoryId)
      );
      if (rootMatch) setSelectedRootId(rootMatch.categoryId);
    }
  });

  const requestProductMutation = useMutation({
    mutationFn: (data: any) => partnerDashboardService.requestNewProduct(data),
    onSuccess: () => {
      draft.clearDraft();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product proposal submitted! Sent to Super Admin for approval.");
      navigate({ to: "/kalkaji/partner/products" as any });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit product proposal.");
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (data.brandId === "__OTHER__" && !data.suggestedBrandName?.trim()) {
      toast.error("Please enter the brand name you want to suggest.");
      return;
    }

    if (activeMode !== "APPLIANCE" && data.exchangeDiscount >= data.productPrice) {
      toast.error("Old battery exchange discount cannot be equal to or greater than selling price.");
      return;
    }

    // Duplicate name check
    try {
      const existingProducts = await queryClient.fetchQuery(productListQuery());
      if (existingProducts) {
        const duplicate = existingProducts.find(
          (p) => p.productName.toLowerCase().trim() === data.productName.toLowerCase().trim()
        );
        if (duplicate) {
          toast.error(`"${data.productName}" already exists in the catalog! Update its city price instead.`);
          return;
        }
      }
    } catch {
      // Ignore if check fails
    }

    const effectiveExchange = activeMode === "APPLIANCE" ? 0 : data.exchangeDiscount || 0;
    const effectiveCapacity =
      activeMode === "AUTOMOTIVE"
        ? data.capacity?.trim() || data.powerOrAhRating?.trim() || undefined
        : data.powerOrAhRating?.trim() || undefined;

    // Build clean highlights combining user bullets + structured specs if not using full specUnits
    const autoBullets: string[] = [];
    if (data.warranty?.trim()) autoBullets.push(`Warranty: ${data.warranty.trim()}`);
    if (data.powerOrAhRating?.trim() && activeMode === "AUTOMOTIVE" && data.capacity?.trim()) {
      autoBullets.push(`Capacity Rating: ${data.powerOrAhRating.trim()}`);
    }
    if (data.batteryType?.trim()) {
      autoBullets.push(
        activeMode === "APPLIANCE"
          ? `System Type: ${data.batteryType.trim()}`
          : `Battery Type: ${data.batteryType.trim()}`
      );
    }

    const combinedHighlights = [
      ...autoBullets,
      ...(data.highlights
        ? data.highlights
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        : []),
    ]
      .filter((v, idx, arr) => arr.indexOf(v) === idx)
      .join("\n");

    const specUnitIdsList = Object.values(data.specUnitIds || {}).filter(Boolean);

    const payload: Record<string, any> = {
      productName: data.productName.trim(),
      productDescription: data.productDescription || undefined,
      productPrice: data.productPrice,
      originalPrice: data.originalPrice || 0,
      exchangeDiscount: effectiveExchange,
      productStock: data.branchStock || 0,
      productImage: data.productImage,
      additionalImages:
        data.additionalImages.length > 0
          ? data.additionalImages.map((i) => i.url).filter(Boolean)
          : undefined,
      categoryId: data.categoryId,
      categoryIds: Array.from(new Set([selectedRootId, data.categoryId].filter(Boolean))),
      brandId: data.brandId === "__OTHER__" ? undefined : data.brandId,
      capacity: effectiveCapacity,
      warranty: data.warranty?.trim() || undefined,
      highlights: combinedHighlights || undefined,
      searchKeywords: data.searchKeywords?.trim() || undefined,
      specUnitIds: specUnitIdsList.length > 0 ? specUnitIdsList : undefined,
      highlightedSpecAttributeIds:
        data.highlightedSpecAttributeIds.length > 0 ? data.highlightedSpecAttributeIds : undefined,
      specAttributeIcons:
        Object.keys(data.specAttributeIcons || {}).length > 0 ? data.specAttributeIcons : undefined,
      cityPrices: data.branchCityId
        ? [
            {
              cityId: data.branchCityId,
              price: data.productPrice,
              exchangeDiscount: effectiveExchange,
              stock: data.branchStock || 0,
            },
          ]
        : undefined,
      proposalReason: data.proposalReason.trim(),
      suggestedBrandName:
        data.brandId === "__OTHER__" ? data.suggestedBrandName?.trim() : undefined,
      seo: { slug: generateSlug(data.productName) },
    };

    requestProductMutation.mutate(payload);
  };

  // Discount calculation for live preview
  const discountPercent =
    watchMrp > watchPrice && watchPrice > 0
      ? Math.round(((watchMrp - watchPrice) / watchMrp) * 100)
      : 0;

  const selectedBrandObj = brands.find((b) => b.brandId === brandId);
  const displayBrandName =
    brandId === "__OTHER__"
      ? form.watch("suggestedBrandName") || "New Brand"
      : selectedBrandObj?.brandName || "Brand";

  const selectedBranchCity = operatingCities.find((c) => c.cityId === watchBranchCityId);

  const isChecklistReady =
    watchName.trim().length >= 2 &&
    !!categoryId &&
    !!brandId &&
    watchPrice > 0 &&
    !!watchImage &&
    (watchProposalReason || "").trim().length >= 5;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/kalkaji/partner/products" as any })}
            title="Back to Products & Pricing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold tracking-tight">Propose New Product</h1>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                Requires Admin Approval
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Submit complete battery specs, pricing & photos — Admin can review and publish with 1 click.
            </p>
          </div>
        </div>

        {operatingCities.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
            <MapPin className="h-3.5 w-3.5" />
            <span>Branch: {selectedBranchCity?.cityName || operatingCities[0].cityName}</span>
          </div>
        )}
      </div>

      <FormDraftBanner
        hasDraft={draft.hasDraft}
        draftTime={draft.draftTime}
        onRestore={draft.restoreDraft}
        onDiscard={draft.clearDraft}
      />

      <form
        id="partner-product-request-form"
        onSubmit={form.handleSubmit(onSubmit as any, (errs) => {
          console.error("Partner product proposal errors:", errs);
          toast.error("Please fill all required fields marked with *");
        })}
        className="flex flex-col lg:flex-row gap-6 items-start"
      >
        {/* LEFT COLUMN (70%) */}
        <div className="flex-1 w-full space-y-6">
          {/* Card 1: Classification FIRST so subsequent fields adapt dynamically */}
          <Card className="shadow-sm border-primary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                1. Category, Brand & Product Title
              </CardTitle>
              <CardDescription>
                Choose the product category first — irrelevant fields automatically hide based on category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Root Category */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Primary Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedRootId}
                    onValueChange={(val) => {
                      setSelectedRootId(val);
                      setManualModeOverride(null);
                      setManualRlCodeEntry(false);
                      form.setValue("categoryId", val, { shouldValidate: true });
                      form.setValue("capacity", "");
                      form.setValue("powerOrAhRating", "");
                      form.setValue("batteryType", "");
                      form.setValue("specUnitIds", {});
                      form.setValue("highlightedSpecAttributeIds", []);
                      form.setValue("specAttributeIcons", {});
                    }}
                  >
                    <SelectTrigger className={form.formState.errors.categoryId && !selectedRootId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category (e.g. Car Battery, Inverter)" />
                    </SelectTrigger>
                    <SelectContent>
                      {rootCategories.map((c) => (
                        <SelectItem key={c.categoryId} value={c.categoryId}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && !selectedRootId && (
                    <p className="text-xs text-red-500">{form.formState.errors.categoryId.message}</p>
                  )}
                </div>

                {/* Subcategory (Only shown when root has subcategories) */}
                {subCategories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Subcategory (Optional)</Label>
                    <Select
                      value={categoryId !== selectedRootId ? categoryId : "none"}
                      onValueChange={(val) => {
                        form.setValue("categoryId", val === "none" ? selectedRootId : val, {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General ({selectedRootCat?.categoryName})</SelectItem>
                        {subCategories.map((sub) => (
                          <SelectItem key={sub.categoryId} value={sub.categoryId}>
                            {sub.categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Brand Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={brandId}
                    onValueChange={(val) => form.setValue("brandId", val, { shouldValidate: true })}
                  >
                    <SelectTrigger className={form.formState.errors.brandId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select brand (Exide, Amaron...)" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.brandId} value={b.brandId}>
                          {b.brandName}
                        </SelectItem>
                      ))}
                      <SelectItem value="__OTHER__" className="font-semibold text-primary">
                        + Other / Suggest New Brand
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.brandId && (
                    <p className="text-xs text-red-500">{form.formState.errors.brandId.message}</p>
                  )}
                </div>
              </div>

              {/* Suggest Brand Input if __OTHER__ selected */}
              {brandId === "__OTHER__" && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-dashed">
                  <Label className="text-xs font-semibold">New Brand Name *</Label>
                  <Input
                    placeholder="Enter exact manufacturer/brand name (e.g. Okaya, Eastman)"
                    {...form.register("suggestedBrandName")}
                  />
                </div>
              )}

              {/* Full Product Name */}
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-xs font-semibold">
                  Full Product / Model Name <span className="text-red-500">*</span>
                </Label>
                <AutoResizeTextarea
                  id="productName"
                  placeholder={
                    activeMode === "AUTOMOTIVE"
                      ? "e.g. Amaron Flo DIN50 (12V 50Ah) Car Battery"
                      : activeMode === "STATIONARY_BATTERY"
                      ? "e.g. Luminous Red Charge RC 18000 (150Ah) Tall Tubular Battery"
                      : "e.g. Luminous Zelio+ 1100 Pure Sine Wave Home Inverter"
                  }
                  {...form.register("productName")}
                />
                {form.formState.errors.productName && (
                  <p className="text-xs text-red-500">{form.formState.errors.productName.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Smart Category-Specific Specifications & Fitment */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {activeMode === "AUTOMOTIVE" ? (
                      <Car className="h-4 w-4 text-blue-600" />
                    ) : activeMode === "STATIONARY_BATTERY" ? (
                      <Battery className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Zap className="h-4 w-4 text-amber-600" />
                    )}
                    2. Technical Specs & Compatibility
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {activeMode === "AUTOMOTIVE" &&
                      "Vehicle Battery Mode: R/L Code & scrap battery exchange fields active."}
                    {activeMode === "STATIONARY_BATTERY" &&
                      "Inverter / Tubular / Solar Battery Mode: Ah capacity & battery type active (R/L Code hidden)."}
                    {activeMode === "APPLIANCE" &&
                      "Inverter / Stabilizer / Appliance Mode: VA rating active (R/L Code & scrap exchange hidden)."}
                  </CardDescription>
                </div>

                {/* Quick mode switcher in case of custom category names */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border shrink-0">
                  {[
                    { id: "AUTOMOTIVE" as const, label: "Vehicle", icon: Car },
                    { id: "STATIONARY_BATTERY" as const, label: "Tubular/Inverter Batt.", icon: Battery },
                    { id: "APPLIANCE" as const, label: "Inverter/UPS", icon: Zap },
                  ].map((m) => {
                    const IconComp = m.icon;
                    const isSelected = activeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setManualModeOverride(m.id);
                          if (m.id !== "AUTOMOTIVE") form.setValue("capacity", "");
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? "bg-background text-foreground shadow-xs border"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <IconComp className="h-3 w-3" />
                        <span className="hidden sm:inline">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* MODE 1: AUTOMOTIVE -> R/L Code Dropdown (only when vehicle battery) */}
              {activeMode === "AUTOMOTIVE" && (
                <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-bold text-blue-900 dark:text-blue-200">
                        R/L Fitment Code (For Auto Vehicle Matching)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Matches this battery to compatible Cars/Bikes/Trucks automatically once approved.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setManualRlCodeEntry(!manualRlCodeEntry)}
                      className="text-xs h-7"
                    >
                      {manualRlCodeEntry ? "Pick from list" : "Enter manually"}
                    </Button>
                  </div>

                  {!manualRlCodeEntry && dbCapacities.length > 0 ? (
                    <Select
                      value={watchCapacity || "none"}
                      onValueChange={(val) =>
                        form.setValue("capacity", val === "none" ? "" : val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select standard R/L code (e.g. DIN50, 38B20L)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Optional / Not Specified --</SelectItem>
                        {dbCapacities.map((cap) => (
                          <SelectItem key={cap.capacityId} value={cap.capacityName}>
                            {cap.capacityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="e.g. DIN50, 38B20L, 42B20R, TZ5"
                      value={watchCapacity || ""}
                      onChange={(e) => form.setValue("capacity", e.target.value, { shouldDirty: true })}
                      className="bg-background"
                    />
                  )}
                </div>
              )}

              {/* Quick Capacity / Rating + Type Fields tailored to activeMode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {activeMode === "APPLIANCE"
                      ? "Power / VA / kVA Rating"
                      : "Ah Capacity Rating"}
                  </Label>
                  <Input
                    placeholder={
                      activeMode === "APPLIANCE"
                        ? "e.g. 1100VA, 2kVA"
                        : activeMode === "STATIONARY_BATTERY"
                        ? "e.g. 150Ah, 200Ah"
                        : "e.g. 35Ah, 45Ah, 65Ah"
                    }
                    {...form.register("powerOrAhRating")}
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(activeMode === "APPLIANCE"
                      ? APPLIANCE_VA_PRESETS
                      : activeMode === "STATIONARY_BATTERY"
                      ? STATIONARY_AH_PRESETS
                      : AUTOMOTIVE_AH_PRESETS
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => form.setValue("powerOrAhRating", preset, { shouldDirty: true })}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          watchPowerOrAh === preset
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warranty with Quick Chips (Relevant for ALL modes) */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Manufacturer Warranty</Label>
                  <Input
                    placeholder="e.g. 48 Months (24 Free + 24 Pro-rata)"
                    {...form.register("warranty")}
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {WARRANTY_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => form.setValue("warranty", preset, { shouldDirty: true })}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          watchWarranty === preset
                            ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Battery Type (Stationary) or System Setup (Appliance) — Hidden in Automotive where R/L handles fitment */}
              {activeMode !== "AUTOMOTIVE" && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {activeMode === "STATIONARY_BATTERY"
                      ? "Battery Technology / Plate Type"
                      : "System / Wave Type"}
                  </Label>
                  <Input
                    placeholder={
                      activeMode === "STATIONARY_BATTERY"
                        ? "e.g. Tall Tubular, Short Tubular, SMF / VRLA"
                        : "e.g. 12V Single Battery, Pure Sine Wave"
                    }
                    {...form.register("batteryType")}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(activeMode === "STATIONARY_BATTERY" ? STATIONARY_TYPES : APPLIANCE_SYSTEMS).map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => form.setValue("batteryType", item, { shouldDirty: true })}
                          className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                            watchBatteryType === item
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-muted/50 hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Backend Category Spec Template (Shown automatically if available for Partner role) */}
              {categoryId && isSpecLoadingEffective ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                  <Spinner size="sm" /> Checking category spec template...
                </div>
              ) : effectiveSpecTemplate && effectiveSpecTemplate.specGroups.length > 0 ? (
                <div className="pt-4 border-t space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Category Template Attributes
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Fill exact values and highlight up to 6 key features.
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Highlighted: {watchedHighlightedIds.length} / 6
                    </Badge>
                  </div>

                  {effectiveSpecTemplate.specGroups.map((group: SpecGroupDto) => (
                    <div key={group.specCategoryId} className="space-y-3">
                      <h4 className="font-semibold text-xs border-b pb-1">{group.specCategoryName}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.attributes.map((attr: SpecAttributeDto) => {
                          const isHighlighted = watchedHighlightedIds.includes(attr.attributeId);
                          return (
                            <div key={attr.attributeId} className="space-y-2.5 p-3 border rounded-lg bg-background">
                              <div className="flex items-start justify-between gap-2">
                                <Label className="font-semibold text-xs leading-snug">{attr.attributeName}</Label>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Label
                                    htmlFor={`hl-${attr.attributeId}`}
                                    className="text-[11px] text-muted-foreground cursor-pointer"
                                  >
                                    Highlight
                                  </Label>
                                  <Checkbox
                                    id={`hl-${attr.attributeId}`}
                                    checked={isHighlighted}
                                    disabled={!isHighlighted && watchedHighlightedIds.length >= 6}
                                    onCheckedChange={(checked) => {
                                      const cur = form.getValues("highlightedSpecAttributeIds") || [];
                                      if (checked) {
                                        if (cur.length >= 6) return;
                                        form.setValue("highlightedSpecAttributeIds", [...cur, attr.attributeId]);
                                      } else {
                                        form.setValue(
                                          "highlightedSpecAttributeIds",
                                          cur.filter((id) => id !== attr.attributeId)
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 items-center">
                                <Select
                                  value={watchedSpecUnitIds[attr.attributeId] || ""}
                                  onValueChange={(val) => {
                                    const next = { ...form.getValues("specUnitIds") };
                                    if (val === "none") delete next[attr.attributeId];
                                    else next[attr.attributeId] = val;
                                    form.setValue("specUnitIds", next);
                                  }}
                                >
                                  <SelectTrigger className="flex-1 h-8 text-xs">
                                    <SelectValue placeholder="Select value..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    {attr.availableUnits.map((u: SpecUnitDto) => (
                                      <SelectItem key={u.unitId} value={u.unitId}>
                                        {u.unitValue}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {isHighlighted && (
                                  <Select
                                    value={watchedSpecAttributeIcons[attr.attributeId] || "none"}
                                    onValueChange={(val) => {
                                      const icons = { ...form.getValues("specAttributeIcons") };
                                      if (val === "none") delete icons[attr.attributeId];
                                      else icons[attr.attributeId] = val;
                                      form.setValue("specAttributeIcons", icons);
                                    }}
                                  >
                                    <SelectTrigger className="w-[95px] h-8 text-xs px-2">
                                      <SelectValue placeholder="Icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Auto</SelectItem>
                                      {AVAILABLE_ICONS.map((ic) => {
                                        const IconComp = ic.icon;
                                        return (
                                          <SelectItem key={ic.id} value={ic.id}>
                                            <div className="flex items-center gap-1.5">
                                              <IconComp className="h-3.5 w-3.5" />
                                              <span className="text-xs">{ic.label}</span>
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Card 3: Media & Photos */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">3. Product Photos</CardTitle>
                <CardDescription>Upload clear battery/product images (supports manual URL fallback too).</CardDescription>
              </div>
              {additionalImageFields.length < 4 && (
                <Button type="button" variant="outline" size="sm" onClick={() => appendImage({ url: "" })}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Gallery Photo
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="productImage"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    folder="products"
                    label="Primary Product Image *"
                    hint="Front-facing photo with clear model/brand label."
                    uploadFn={partnerDashboardService.uploadProductImage}
                    error={form.formState.errors.productImage?.message}
                  />
                )}
              />

              {additionalImageFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-xs font-semibold">Additional Gallery Photos ({additionalImageFields.length}/4)</Label>
                  {additionalImageFields.map((fieldItem, idx) => (
                    <div key={fieldItem.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Controller
                          control={form.control}
                          name={`additionalImages.${idx}.url` as const}
                          render={({ field }) => (
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              folder="products"
                              label={`Additional Photo ${idx + 1}`}
                              uploadFn={partnerDashboardService.uploadProductImage}
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 mt-8"
                        onClick={() => removeImage(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Description, Highlights, Search Tags & Admin Note */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">4. Description & Proposal Reason</CardTitle>
              <CardDescription>
                Add customer-facing highlights plus your branch justification for Admin review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Key Bullet Highlights (One per line, optional)</Label>
                <AutoResizeTextarea
                  placeholder={"Zero-maintenance sealed calcium-calcium technology\nHigh cranking power even in winters\nFactory charged & ready for doorstep installation"}
                  {...form.register("highlights")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Product Description (Optional)</Label>
                <Controller
                  name="productDescription"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Write detailed product overview, dimensions, and key advantages..."
                      minHeight="130px"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="searchKeywords" className="text-xs font-semibold flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  Search Keywords / Common Names (Optional)
                </Label>
                <AutoResizeTextarea
                  id="searchKeywords"
                  placeholder="e.g. swift diesel battery, creta din50, amaron flo 50ah"
                  {...form.register("searchKeywords")}
                />
              </div>

              <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/25 space-y-2">
                <Label htmlFor="proposalReason" className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Reason for Proposal (Internal Note to Admin) <span className="text-red-500">*</span>
                </Label>
                <AutoResizeTextarea
                  id="proposalReason"
                  placeholder="e.g. Customers in South Delhi regularly request this 2026 variant; stock available at distributor."
                  {...form.register("proposalReason")}
                  className="bg-background"
                />
                {form.formState.errors.proposalReason && (
                  <p className="text-xs text-red-500">{form.formState.errors.proposalReason.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (30% - Sticky Pricing, Branch Stock & Live Preview) */}
        <div className="w-full lg:w-88 space-y-6 lg:sticky lg:top-20">
          {/* Pricing & Branch Launch Stock */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pricing & Branch Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="productPrice" className="text-xs font-semibold">
                  Proposed Selling Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="productPrice"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 5499"
                  {...form.register("productPrice")}
                />
                {form.formState.errors.productPrice && (
                  <p className="text-xs text-red-500">{form.formState.errors.productPrice.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="originalPrice" className="text-xs font-semibold">
                    MRP / Original Price (₹)
                  </Label>
                  {discountPercent > 0 && (
                    <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">
                      {discountPercent}% OFF
                    </Badge>
                  )}
                </div>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 6800"
                  {...form.register("originalPrice")}
                />
                {watchMrp > 0 && watchMrp < watchPrice && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> MRP is lower than selling price
                  </p>
                )}
              </div>

              {/* Old Battery Exchange ONLY shown for Battery modes */}
              {activeMode !== "APPLIANCE" && (
                <div className="space-y-1.5 pt-2 border-t">
                  <Label htmlFor="exchangeDiscount" className="text-xs font-semibold">
                    Old Battery Exchange Discount (₹)
                  </Label>
                  <Input
                    id="exchangeDiscount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 850"
                    {...form.register("exchangeDiscount")}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Scrap discount deducted when customer exchanges their old battery.
                  </p>
                  {watchPrice > 0 && watchExchange >= watchPrice && (
                    <p className="text-[11px] text-red-600 font-medium">
                      Cannot exceed selling price!
                    </p>
                  )}
                </div>
              )}

              {/* Branch Stock Allocation */}
              <div className="space-y-2.5 pt-3 border-t">
                <Label htmlFor="branchStock" className="text-xs font-semibold">
                  Your Initial Branch Stock (Units)
                </Label>
                <Input
                  id="branchStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  {...form.register("branchStock")}
                />

                {operatingCities.length > 1 && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Apply stock to branch:</Label>
                    <Select
                      value={watchBranchCityId || ""}
                      onValueChange={(val) => form.setValue("branchCityId", val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Branch City" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatingCities.map((c) => (
                          <SelectItem key={c.cityId} value={c.cityId} className="text-xs">
                            {c.cityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Storefront Card Preview */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-2 bg-muted/40 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Storefront Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="aspect-[4/3] w-full rounded-lg border bg-white flex items-center justify-center overflow-hidden p-2">
                {watchImage ? (
                  <img
                    src={normalizeImageUrl(watchImage)}
                    alt={watchName || "Preview"}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground text-xs space-y-1">
                    <Package className="h-8 w-8 mx-auto opacity-30" />
                    <p>Product photo preview</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    {displayBrandName}
                  </Badge>
                  {activeCategoryName && (
                    <Badge variant="outline" className="text-[10px]">
                      {activeCategoryName}
                    </Badge>
                  )}
                  {(watchCapacity || watchPowerOrAh) && (
                    <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">
                      {activeMode === "AUTOMOTIVE" && watchCapacity
                        ? watchCapacity
                        : watchPowerOrAh}
                    </Badge>
                  )}
                </div>
                <p className="font-bold text-sm leading-snug line-clamp-2">
                  {watchName || "Battery Model Name"}
                </p>
                {watchWarranty && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {watchWarranty} Warranty
                  </p>
                )}
              </div>

              <div className="pt-2 border-t flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-extrabold">
                  ₹{watchPrice > 0 ? watchPrice.toLocaleString("en-IN") : "0"}
                </span>
                {watchMrp > watchPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    ₹{watchMrp.toLocaleString("en-IN")}
                  </span>
                )}
                {activeMode !== "APPLIANCE" && watchExchange > 0 && watchPrice > watchExchange && (
                  <p className="w-full text-[11px] text-emerald-700 font-semibold">
                    Effective w/ Old Battery: ₹{(watchPrice - watchExchange).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Box */}
          <Card className="shadow-sm border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${categoryId && brandId ? "text-emerald-600" : "text-muted-foreground/40"}`} />
                  <span>Category & Brand selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${watchName.trim().length >= 2 ? "text-emerald-600" : "text-muted-foreground/40"}`} />
                  <span>Product Name filled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${watchImage ? "text-emerald-600" : "text-muted-foreground/40"}`} />
                  <span>Primary Image uploaded</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${watchPrice > 0 ? "text-emerald-600" : "text-muted-foreground/40"}`} />
                  <span>Selling Price entered</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${(watchProposalReason || "").trim().length >= 5 ? "text-emerald-600" : "text-muted-foreground/40"}`} />
                  <span>Proposal Reason provided</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-bold"
                size="lg"
                disabled={requestProductMutation.isPending}
              >
                {requestProductMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="text-white" /> Submitting Proposal...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit for Admin Approval
                  </>
                )}
              </Button>

              {!isChecklistReady && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Draft auto-saves locally every few seconds while you complete fields.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
