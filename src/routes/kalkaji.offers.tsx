import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Flame, Plus, Edit, Trash2, Check, Clock, Sparkles, AlertCircle,
  ExternalLink, Search, RefreshCw, Calendar, Tag, Layers, CheckCircle2,
  Sliders, Eye, EyeOff, Package, X
} from "lucide-react";
import { campaignService } from "@/services/campaign.service";
import { adminCampaignsQuery, categoriesQuery, brandsQuery, productListQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { getCampaignThemeStyles, formatCampaignDiscountLabel } from "@/lib/campaign-utils";
import type {
  CampaignResponse,
  CreateCampaignRequest,
  CampaignBadgeTheme,
  CampaignDiscountType,
  CampaignTargetType,
} from "@/types/dto";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/feedback/Spinner";
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
import { cn, toSlug } from "@/lib/utils";

export const Route = createFileRoute("/kalkaji/offers")({
  component: AdminOffersPage,
  errorComponent: ({ error, reset }: { error: any; reset: () => void }) => (
    <div className="p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold">Failed to load Offers</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {error?.message || "An unexpected error occurred while loading campaigns."}
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" /> Try Again
      </Button>
    </div>
  ),
});

function safeFormatDate(dateStr?: string | null, fmt = "dd MMM yy"): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, fmt);
  } catch {
    return "N/A";
  }
}

const campaignSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  slug: z.string().trim().min(3, "Slug must be at least 3 characters"),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  badgeText: z.string().optional().nullable(),
  badgeTheme: z.enum(["FESTIVE_GOLD", "BRAND_RED", "ROYAL_BLUE", "EMERALD_GREEN"]).default("FESTIVE_GOLD"),
  desktopBannerUrl: z.string().optional().nullable(),
  mobileBannerUrl: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().default(0),
  showCountdown: z.boolean().default(true),
  showInAnnouncement: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  targetType: z.enum(["ALL_PRODUCTS", "CATEGORIES", "BRANDS", "CUSTOM_PRODUCTS"]).default("ALL_PRODUCTS"),
  discountType: z.enum(["FLAT_AMOUNT", "PERCENTAGE", "EXTRA_EXCHANGE_BONUS", "SHOWCASE_ONLY"]).default("FLAT_AMOUNT"),
  discountValue: z.coerce.number().default(0),
  maxDiscountCap: z.coerce.number().optional().nullable(),
  minOrderValue: z.coerce.number().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  brandIds: z.array(z.string()).default([]),
  productIds: z.array(z.string()).default([]),
  productDiscounts: z.record(z.string(), z.coerce.number()).optional().default({}),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

function AdminOffersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  // Auxiliary data for entity targeting selection
  const { data: rawCategories = [] } = useQuery(categoriesQuery());
  const { data: rawBrands = [] } = useQuery(brandsQuery());
  const { data: rawProducts = [] } = useQuery(productListQuery());

  const { data: rawCampaigns = [], isLoading, isError } = useQuery(adminCampaignsQuery(statusFilter));

  const categories = useMemo(() => Array.isArray(rawCategories) ? rawCategories : [], [rawCategories]);
  const brands = useMemo(() => Array.isArray(rawBrands) ? rawBrands : [], [rawBrands]);
  const products = useMemo(() => Array.isArray(rawProducts) ? rawProducts : [], [rawProducts]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) => {
      const name = (p.productName || "").toLowerCase();
      const brand = (p.brandName || "").toLowerCase();
      const cap = (p.capacity || p.capacityAh || "").toLowerCase();
      const cat = (p.productCategory || "").toLowerCase();
      return name.includes(q) || brand.includes(q) || cap.includes(q) || cat.includes(q);
    });
  }, [products, productSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter((c) => (c.categoryName || "").toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase().trim();
    return brands.filter((b) => (b.brandName || "").toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const campaignList: CampaignResponse[] = useMemo(() => {
    if (Array.isArray(rawCampaigns)) return rawCampaigns;
    if (rawCampaigns && typeof rawCampaigns === "object" && Array.isArray((rawCampaigns as any).content)) {
      return (rawCampaigns as any).content;
    }
    return [];
  }, [rawCampaigns]);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      badgeText: "Festival Special",
      badgeTheme: "FESTIVE_GOLD",
      desktopBannerUrl: "",
      mobileBannerUrl: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      isActive: true,
      priority: 0,
      showCountdown: true,
      showInAnnouncement: true,
      showOnHome: true,
      targetType: "ALL_PRODUCTS",
      discountType: "FLAT_AMOUNT",
      discountValue: 500,
      maxDiscountCap: null,
      minOrderValue: null,
      couponCode: "",
      categoryIds: [],
      brandIds: [],
      productIds: [],
      productDiscounts: {},
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: CampaignFormValues) => {
      const payload: CreateCampaignRequest = {
        name: values.name,
        slug: values.slug,
        tagline: values.tagline || null,
        description: values.description || null,
        badgeText: values.badgeText || null,
        badgeTheme: values.badgeTheme as CampaignBadgeTheme,
        desktopBannerUrl: values.desktopBannerUrl || null,
        mobileBannerUrl: values.mobileBannerUrl || null,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        isActive: values.isActive,
        priority: values.priority,
        showCountdown: values.showCountdown,
        showInAnnouncement: values.showInAnnouncement,
        showOnHome: values.showOnHome,
        targetType: values.targetType as CampaignTargetType,
        discountType: values.discountType as CampaignDiscountType,
        discountValue: values.discountValue,
        maxDiscountCap: values.maxDiscountCap || null,
        minOrderValue: values.minOrderValue || null,
        couponCode: values.couponCode ? values.couponCode.trim().toUpperCase() : null,
        categoryIds: values.targetType === "CATEGORIES" ? values.categoryIds : [],
        brandIds: values.targetType === "BRANDS" ? values.brandIds : [],
        productIds: values.targetType === "CUSTOM_PRODUCTS" ? values.productIds : [],
        productDiscounts: values.targetType === "CUSTOM_PRODUCTS" ? values.productDiscounts : {},
      };

      if (editingCampaign) {
        return campaignService.updateCampaign(editingCampaign.id, payload);
      }
      return campaignService.createCampaign(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast.success(editingCampaign ? "Campaign updated successfully!" : "Campaign created successfully!");
      setIsModalOpen(false);
      setEditingCampaign(null);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to save campaign");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignService.deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast.success("Campaign deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete campaign");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => campaignService.toggleCampaignStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast.success("Campaign status updated");
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to toggle status");
    },
  });

  const openCreateModal = () => {
    setEditingCampaign(null);
    form.reset({
      name: "",
      slug: "",
      tagline: "",
      description: "",
      badgeText: "Diwali Special",
      badgeTheme: "FESTIVE_GOLD",
      desktopBannerUrl: "",
      mobileBannerUrl: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      isActive: true,
      priority: 0,
      showCountdown: true,
      showInAnnouncement: true,
      showOnHome: true,
      targetType: "ALL_PRODUCTS",
      discountType: "FLAT_AMOUNT",
      discountValue: 500,
      maxDiscountCap: null,
      minOrderValue: null,
      couponCode: "",
      categoryIds: [],
      brandIds: [],
      productIds: [],
      productDiscounts: {},
    });
    setActiveTab("basic");
    setProductSearch("");
    setCategorySearch("");
    setBrandSearch("");
    setIsModalOpen(true);
  };

  const toLocalInputDate = (dStr?: string | null) => {
    if (!dStr) return new Date().toISOString().slice(0, 16);
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  };

  const openEditModal = (c: CampaignResponse) => {
    setEditingCampaign(c);
    form.reset({
      name: c.name,
      slug: c.slug,
      tagline: c.tagline || "",
      description: c.description || "",
      badgeText: c.badgeText || "",
      badgeTheme: c.badgeTheme || "FESTIVE_GOLD",
      desktopBannerUrl: c.desktopBannerUrl || "",
      mobileBannerUrl: c.mobileBannerUrl || "",
      startDate: toLocalInputDate(c.startDate),
      endDate: toLocalInputDate(c.endDate),
      isActive: c.isActive,
      priority: c.priority || 0,
      showCountdown: c.showCountdown,
      showInAnnouncement: c.showInAnnouncement,
      showOnHome: c.showOnHome,
      targetType: c.targetType,
      discountType: c.discountType,
      discountValue: c.discountValue || 0,
      maxDiscountCap: c.maxDiscountCap || null,
      minOrderValue: c.minOrderValue || null,
      couponCode: c.couponCode || "",
      categoryIds: c.categoryIds || [],
      brandIds: c.brandIds || [],
      productIds: c.productIds || [],
      productDiscounts: (c as any).productDiscounts || {},
    });
    setActiveTab("basic");
    setProductSearch("");
    setCategorySearch("");
    setBrandSearch("");
    setIsModalOpen(true);
  };

  // Watchers for reactive UI
  const watchedName = form.watch("name");
  const watchedTargetType = form.watch("targetType");
  const watchedDiscountType = form.watch("discountType");
  const watchedBadgeTheme = form.watch("badgeTheme");
  const watchedCategoryIds = form.watch("categoryIds") || [];
  const watchedBrandIds = form.watch("brandIds") || [];
  const watchedProductIds = form.watch("productIds") || [];
  const watchedProductDiscounts: Record<string, number> = form.watch("productDiscounts") || {};
  const watchedDiscountValue = form.watch("discountValue") || 0;

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    return campaignList.filter((c) => {
      if (!c) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.slug || "").toLowerCase().includes(q) ||
        (c.couponCode && c.couponCode.toLowerCase().includes(q))
      );
    });
  }, [campaignList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-600" />
            Offers & Campaign Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, schedule, and showcase festive discounts, flash sales, and marketing campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openCreateModal} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Create Offer / Campaign
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="ALL">All Offers</TabsTrigger>
            <TabsTrigger value="ACTIVE">Live / Active</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
            <TabsTrigger value="EXPIRED">Expired</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or coupon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <Spinner />
            <p className="text-xs text-muted-foreground mt-2">Loading campaigns...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-semibold">Unable to fetch campaigns</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              The campaigns endpoint is currently initializing or backend is restarting.
            </p>
            <Button onClick={() => qc.invalidateQueries({ queryKey: queryKeys.campaigns.all })} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Flame className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <h3 className="text-base font-semibold">No campaigns found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Get started by launching your first festive offer, discount rule, or showcase banner!
            </p>
            <Button onClick={openCreateModal} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Create Campaign
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[280px]">Campaign / Offer</TableHead>
                <TableHead>Badge & Theme</TableHead>
                <TableHead>Discount Rule</TableHead>
                <TableHead>Targeting</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-center">Priority</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((c) => {
                const styles = getCampaignThemeStyles(c.badgeTheme);
                const discountLabel = formatCampaignDiscountLabel(c);
                const startMs = c.startDate ? new Date(c.startDate).getTime() : 0;
                const endMs = c.endDate ? new Date(c.endDate).getTime() : 0;
                const nowMs = Date.now();
                const isLive = c.isActive && startMs > 0 && startMs <= nowMs && (endMs === 0 || endMs >= nowMs);
                const isUpcoming = c.isActive && startMs > nowMs;
                const isExpired = endMs > 0 && endMs < nowMs;

                return (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {c.desktopBannerUrl ? (
                          <img
                            src={c.desktopBannerUrl}
                            alt={c.name}
                            className="w-14 h-9 object-cover rounded-md border shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className={cn("w-14 h-9 rounded-md flex items-center justify-center shrink-0 border", styles.barBg)}>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-foreground truncate">{c.name}</span>
                            <Link
                              to="/offers/$slug"
                              params={{ slug: c.slug }}
                              target="_blank"
                              className="text-muted-foreground hover:text-foreground"
                              title="View Landing Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{c.tagline || c.slug}</div>
                          {c.couponCode && (
                            <div className="inline-block mt-0.5 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted border">
                              CODE: {c.couponCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-tight",
                          styles.badgeBg
                        )}
                      >
                        <Sparkles className="w-3 h-3" />
                        {c.badgeText || "Offer"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-xs text-foreground">{discountLabel}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.discountType === "SHOWCASE_ONLY" ? "No math applied" : `Type: ${c.discountType}`}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-foreground">
                        {c.targetType === "ALL_PRODUCTS" && "All Products (Storewide)"}
                        {c.targetType === "CATEGORIES" && `${c.categoryIds?.length || 0} Categories`}
                        {c.targetType === "BRANDS" && `${c.brandIds?.length || 0} Brands`}
                        {c.targetType === "CUSTOM_PRODUCTS" && (
                          <div>
                            <span>{c.productIds?.length || 0} Products</span>
                            {c.productDiscounts && Object.keys(c.productDiscounts).length > 0 && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                ({Object.keys(c.productDiscounts).length} custom discounts)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{safeFormatDate(c.startDate, "dd MMM")} - {safeFormatDate(c.endDate, "dd MMM yy")}</span>
                        </div>
                        <div>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              ● Live Now
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">
                              ⏰ Scheduled
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-neutral-200 px-1.5 py-0.2 rounded-full">
                              Expired
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-bold">
                      {c.priority}
                    </TableCell>

                    <TableCell className="text-center">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => toggleStatusMutation.mutate(c.id)}
                        disabled={toggleStatusMutation.isPending}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(c)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &ldquo;{c.name}&rdquo;? Active discounts and landing page will be immediately disabled.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(c.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
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
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Campaign Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[96vw] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Flame className="w-5 h-5 text-red-600" />
              {editingCampaign ? "Edit Campaign / Offer" : "Create New Campaign / Offer"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((v: any) => saveMutation.mutate(v))} className="space-y-6 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 gap-1">
                <TabsTrigger value="basic" className="text-xs sm:text-sm py-1.5 px-2 truncate">1. Basic Info</TabsTrigger>
                <TabsTrigger value="media" className="text-xs sm:text-sm py-1.5 px-2 truncate">2. Banners & Badges</TabsTrigger>
                <TabsTrigger value="discount" className="text-xs sm:text-sm py-1.5 px-2 truncate">3. Discounts</TabsTrigger>
                <TabsTrigger value="targeting" className="text-xs sm:text-sm py-1.5 px-2 truncate">4. Targeting</TabsTrigger>
              </TabsList>

              {/* TAB 1: BASIC INFO & TIMING */}
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Diwali Dhamaka Sale 2026"
                      {...form.register("name", {
                        onChange: (e) => {
                          if (!editingCampaign) {
                            form.setValue("slug", toSlug(e.target.value));
                          }
                        },
                      })}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-rose-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="e.g. diwali-dhamaka-sale"
                      {...form.register("slug")}
                    />
                    <p className="text-[11px] text-muted-foreground">Will be accessible at /offers/{form.watch("slug") || "your-slug"}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Tagline / Short Hook</Label>
                  <Input
                    id="tagline"
                    placeholder="e.g. Flat ₹500 off on exchange + Free installation"
                    {...form.register("tagline")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Explain the offer details, warranty assurances, terms, etc."
                    {...form.register("description")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start Date & Time *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      {...form.register("startDate")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">End Date & Time *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      {...form.register("endDate")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor="priority">Showcase Priority (Higher = Top)</Label>
                    <Input
                      id="priority"
                      type="number"
                      {...form.register("priority")}
                    />
                    <p className="text-[11px] text-muted-foreground">Used to decide which banner / ticker takes precedence.</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 mt-3">
                    <div>
                      <div className="font-semibold text-sm">Campaign Active</div>
                      <div className="text-xs text-muted-foreground">Enable or pause this campaign immediately.</div>
                    </div>
                    <Controller
                      name="isActive"
                      control={form.control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: BANNERS & VISUAL BADGES */}
              <TabsContent value="media" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="badgeText">Badge Text (e.g. Diwali Dhamaka)</Label>
                    <Input
                      id="badgeText"
                      placeholder="e.g. DIWALI SPECIAL"
                      {...form.register("badgeText")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="badgeTheme">Visual Theme Palette</Label>
                    <select
                      id="badgeTheme"
                      {...form.register("badgeTheme")}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="FESTIVE_GOLD">Festive Gold (Amber / Diwali / Celebrations)</option>
                      <option value="BRAND_RED">Brand Red (Bold / Sale / Hot Deals)</option>
                      <option value="ROYAL_BLUE">Royal Blue (Monsoon / Premium / Inverters)</option>
                      <option value="EMERALD_GREEN">Emerald Green (Eco / Solar / Savings)</option>
                    </select>
                  </div>
                </div>

                {/* Theme Preview Pill */}
                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Live Theme Preview:</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm",
                      getCampaignThemeStyles(watchedBadgeTheme as CampaignBadgeTheme).badgeBg
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {form.watch("badgeText") || "Offer Preview"}
                  </span>
                </div>

                {/* Desktop & Mobile Banner Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Controller
                    name="desktopBannerUrl"
                    control={form.control}
                    render={({ field }) => (
                      <CloudinaryUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        folder="campaigns"
                        label="Desktop Hero Banner (1920x600 recommended)"
                      />
                    )}
                  />

                  <Controller
                    name="mobileBannerUrl"
                    control={form.control}
                    render={({ field }) => (
                      <CloudinaryUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        folder="campaigns"
                        label="Mobile Banner (800x600 recommended)"
                      />
                    )}
                  />
                </div>

                {/* Placements & Features */}
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="text-sm font-semibold">Storefront Placements</h4>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div>
                      <div className="font-semibold text-sm">Top Announcement Bar</div>
                      <div className="text-xs text-muted-foreground">Show ticker at the top of the header across all store pages.</div>
                    </div>
                    <Controller
                      name="showInAnnouncement"
                      control={form.control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div>
                      <div className="font-semibold text-sm">Home Page Spotlight Section</div>
                      <div className="text-xs text-muted-foreground">Show glowing festive showcase container on the home page.</div>
                    </div>
                    <Controller
                      name="showOnHome"
                      control={form.control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div>
                      <div className="font-semibold text-sm">Live Countdown Timer</div>
                      <div className="text-xs text-muted-foreground">Show ticking urgency clock (Days:Hours:Mins:Secs).</div>
                    </div>
                    <Controller
                      name="showCountdown"
                      control={form.control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: DISCOUNT RULES & COUPON */}
              <TabsContent value="discount" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discountType">Discount Calculation Rule</Label>
                  <select
                    id="discountType"
                    {...form.register("discountType")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="FLAT_AMOUNT">Flat Amount (e.g. ₹500 off order/item)</option>
                    <option value="PERCENTAGE">Percentage (e.g. 10% off)</option>
                    <option value="EXTRA_EXCHANGE_BONUS">Extra Scrap Exchange Bonus (e.g. +₹300 on trade-in)</option>
                    <option value="SHOWCASE_ONLY">Showcase Only (Marketing banner without price deduction)</option>
                  </select>
                </div>

                {watchedDiscountType !== "SHOWCASE_ONLY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="discountValue">
                        {watchedDiscountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Discount Value (₹)"} *
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        placeholder="e.g. 500"
                        {...form.register("discountValue")}
                      />
                    </div>

                    {watchedDiscountType === "PERCENTAGE" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="maxDiscountCap">Max Cap (₹, Optional)</Label>
                        <Input
                          id="maxDiscountCap"
                          type="number"
                          placeholder="e.g. 1000"
                          {...form.register("maxDiscountCap")}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="minOrderValue">Minimum Order Value (₹, Optional)</Label>
                    <Input
                      id="minOrderValue"
                      type="number"
                      placeholder="e.g. 2500"
                      {...form.register("minOrderValue")}
                    />
                    <p className="text-[11px] text-muted-foreground">Order must meet this amount before discount applies.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                    <Input
                      id="couponCode"
                      placeholder="e.g. DIWALI500 (Leave blank for auto-apply)"
                      {...form.register("couponCode")}
                      className="font-mono uppercase"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      If blank, offer is automatically applied to all eligible items.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: ENTITY TARGETING */}
              <TabsContent value="targeting" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="targetType">Applicable Products / Target Type</Label>
                  <select
                    id="targetType"
                    {...form.register("targetType")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL_PRODUCTS">All Products (Entire Catalogue Storewide)</option>
                    <option value="CATEGORIES">Specific Categories (e.g. Car Batteries, Inverters)</option>
                    <option value="BRANDS">Specific Brands (e.g. Exide, Amaron)</option>
                    <option value="CUSTOM_PRODUCTS">Handpicked Custom Products</option>
                  </select>
                </div>

                {/* TARGET = CATEGORIES */}
                {watchedTargetType === "CATEGORIES" && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">
                        Select Target Categories ({watchedCategoryIds.length} selected)
                      </Label>
                      {watchedCategoryIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => form.setValue("categoryIds", [])}
                          className="text-[11px] text-red-600 hover:underline font-semibold"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories..."
                        className="pl-8 h-8 text-xs"
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                      {filteredCategories.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
                          No categories match "{categorySearch}"
                        </div>
                      ) : (
                        filteredCategories.map((cat) => {
                          const isSelected = watchedCategoryIds.includes(cat.categoryId);
                          return (
                            <button
                              key={cat.categoryId}
                              type="button"
                              onClick={() => {
                                const updated = isSelected
                                  ? watchedCategoryIds.filter((id) => id !== cat.categoryId)
                                  : [...watchedCategoryIds, cat.categoryId];
                                form.setValue("categoryIds", updated);
                              }}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md text-left text-xs transition-all border min-w-0 select-none",
                                isSelected
                                  ? "bg-red-50 border-red-300 text-red-900 font-bold dark:bg-red-950/40 dark:text-red-300"
                                  : "bg-card border-border/60 hover:bg-muted text-foreground"
                              )}
                            >
                              <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0", isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground/40")}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="truncate flex-1">{cat.categoryName}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TARGET = BRANDS */}
                {watchedTargetType === "BRANDS" && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">
                        Select Target Brands ({watchedBrandIds.length} selected)
                      </Label>
                      {watchedBrandIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => form.setValue("brandIds", [])}
                          className="text-[11px] text-red-600 hover:underline font-semibold"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="Search brands..."
                        className="pl-8 h-8 text-xs"
                      />
                      {brandSearch && (
                        <button
                          type="button"
                          onClick={() => setBrandSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                      {filteredBrands.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
                          No brands match "{brandSearch}"
                        </div>
                      ) : (
                        filteredBrands.map((b) => {
                          const isSelected = watchedBrandIds.includes(b.brandId);
                          return (
                            <button
                              key={b.brandId}
                              type="button"
                              onClick={() => {
                                const updated = isSelected
                                  ? watchedBrandIds.filter((id) => id !== b.brandId)
                                  : [...watchedBrandIds, b.brandId];
                                form.setValue("brandIds", updated);
                              }}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md text-left text-xs transition-all border min-w-0 select-none",
                                isSelected
                                  ? "bg-red-50 border-red-300 text-red-900 font-bold dark:bg-red-950/40 dark:text-red-300"
                                  : "bg-card border-border/60 hover:bg-muted text-foreground"
                              )}
                            >
                              <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0", isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground/40")}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="truncate flex-1">{b.brandName}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TARGET = CUSTOM PRODUCTS */}
                {watchedTargetType === "CUSTOM_PRODUCTS" && (
                  <div className="space-y-2.5 pt-2 border-t">
                    {/* Header + Selection Counter & Quick Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">
                        Select Handpicked Products ({watchedProductIds.length} of {products.length} selected)
                      </Label>
                      {watchedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue("productIds", [], { shouldDirty: true });
                            form.setValue("productDiscounts", {}, { shouldDirty: true });
                          }}
                          className="text-[11px] text-red-600 hover:underline font-semibold self-start sm:self-auto cursor-pointer"
                        >
                          Clear Selection ({watchedProductIds.length})
                        </button>
                      )}
                    </div>

                    {/* Instant Search Bar + Select/Deselect All Filtered */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by name, brand, capacity, category..."
                          className="pl-9 pr-8 h-9 text-xs"
                        />
                        {productSearch && (
                          <button
                            type="button"
                            onClick={() => setProductSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {filteredProducts.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs shrink-0 whitespace-nowrap"
                          onClick={() => {
                            const filteredIds = filteredProducts.map((p) => p.productId);
                            const allSelected = filteredIds.every((id) => watchedProductIds.includes(id));
                            if (allSelected) {
                              form.setValue(
                                "productIds",
                                watchedProductIds.filter((id) => !filteredIds.includes(id)),
                                { shouldDirty: true }
                              );
                              const copy = { ...watchedProductDiscounts };
                              filteredIds.forEach((id) => delete copy[id]);
                              form.setValue("productDiscounts", copy, { shouldDirty: true });
                            } else {
                              const union = Array.from(new Set([...watchedProductIds, ...filteredIds]));
                              form.setValue("productIds", union, { shouldDirty: true });
                            }
                          }}
                        >
                          {filteredProducts.every((p) => watchedProductIds.includes(p.productId))
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      )}
                    </div>

                    {/* Product List with Image Thumbnail & Guaranteed Price Column */}
                    <div className="space-y-1.5 max-h-72 sm:max-h-80 overflow-y-auto overflow-x-hidden p-2 border rounded-lg bg-muted/20">
                      {filteredProducts.length === 0 ? (
                        <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                          <Package className="w-8 h-8 mx-auto opacity-40 text-muted-foreground" />
                          <div>No products match "{productSearch}"</div>
                          {productSearch && (
                            <button
                              type="button"
                              onClick={() => setProductSearch("")}
                              className="text-red-600 hover:underline font-semibold"
                            >
                              Clear search query
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = watchedProductIds.includes(p.productId);
                          const customDiscountValue = watchedProductDiscounts[p.productId];
                          const hasCustomDiscount = customDiscountValue !== undefined && customDiscountValue !== null;

                          let effectiveDiscount = 0;
                          if (hasCustomDiscount) {
                            effectiveDiscount = Number(customDiscountValue);
                          } else if (watchedDiscountType === "FLAT_AMOUNT") {
                            effectiveDiscount = Number(watchedDiscountValue || 0);
                          } else if (watchedDiscountType === "PERCENTAGE") {
                            effectiveDiscount = Math.round((p.productPrice * Number(watchedDiscountValue || 0)) / 100);
                            if (form.watch("maxDiscountCap")) {
                              effectiveDiscount = Math.min(effectiveDiscount, Number(form.watch("maxDiscountCap")));
                            }
                          } else if (watchedDiscountType === "EXTRA_EXCHANGE_BONUS") {
                            effectiveDiscount = Number(watchedDiscountValue || 0);
                          }

                          const dealPrice = Math.max(0, p.productPrice - effectiveDiscount);

                          return (
                            <div
                              key={p.productId}
                              className={cn(
                                "w-full rounded-lg transition-all border select-none focus-within:ring-2 focus-within:ring-red-500",
                                isSelected
                                  ? "bg-red-50/90 border-red-300 text-red-950 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800 shadow-2xs"
                                  : "bg-card border-border/60 hover:bg-muted/80 text-foreground"
                              )}
                            >
                              {/* Main Clickable Row: Checkbox, Thumbnail, Title, Price */}
                              <div
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onClick={() => {
                                  const updated = isSelected
                                    ? watchedProductIds.filter((id) => id !== p.productId)
                                    : [...watchedProductIds, p.productId];
                                  form.setValue("productIds", updated, { shouldDirty: true });
                                  if (isSelected) {
                                    const copy = { ...watchedProductDiscounts };
                                    delete copy[p.productId];
                                    form.setValue("productDiscounts", copy, { shouldDirty: true });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === " " || e.key === "Enter") {
                                    e.preventDefault();
                                    const updated = isSelected
                                      ? watchedProductIds.filter((id) => id !== p.productId)
                                      : [...watchedProductIds, p.productId];
                                    form.setValue("productIds", updated, { shouldDirty: true });
                                    if (isSelected) {
                                      const copy = { ...watchedProductDiscounts };
                                      delete copy[p.productId];
                                      form.setValue("productDiscounts", copy, { shouldDirty: true });
                                    }
                                  }
                                }}
                                className="flex items-center justify-between p-2 cursor-pointer gap-2.5"
                              >
                                {/* Left: Checkbox + Photo + Product Info */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {/* Checkbox */}
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors",
                                      isSelected
                                        ? "bg-red-600 border-red-600 text-white"
                                        : "border-input bg-background"
                                    )}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>

                                  {/* Product Photo Thumbnail */}
                                  <div className="w-10 h-10 rounded-md border border-border/60 bg-white flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-2xs">
                                    {p.productImage ? (
                                      <img
                                        src={p.productImage}
                                        alt={p.productName}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <Package className="w-4 h-4 text-muted-foreground/40" />
                                    )}
                                  </div>

                                  {/* Product Titles & Brand/Capacity Subtitles */}
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className="font-semibold text-foreground text-xs leading-snug truncate"
                                      title={p.productName}
                                    >
                                      {p.productName}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 truncate">
                                      {p.brandName && (
                                        <span className="font-semibold text-foreground/80 px-1 py-0.2 rounded bg-muted">
                                          {p.brandName}
                                        </span>
                                      )}
                                      {(p.capacity || p.capacityAh) && (
                                        <span>{p.capacity || p.capacityAh}</span>
                                      )}
                                      {p.productCategory && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">{p.productCategory}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Price + Deal Price */}
                                <div className="shrink-0 text-right pl-2">
                                  <div className="text-xs font-bold font-mono text-foreground whitespace-nowrap">
                                    ₹{p.productPrice?.toLocaleString("en-IN") || "0"}
                                  </div>
                                  {isSelected && (
                                    <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                      Deal: ₹{dealPrice.toLocaleString("en-IN")}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Custom Discount Config Strip (Visible when checked) */}
                              {isSelected && (
                                <div
                                  className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 border-t border-red-200/60 dark:border-red-900/40 bg-white/70 dark:bg-black/20 rounded-b-lg text-[11px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Tag className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                    <span className="font-semibold text-foreground/90 text-xs">Custom Discount:</span>
                                    <div className="relative w-28">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-xs">₹</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={p.productPrice}
                                        value={hasCustomDiscount ? customDiscountValue : ""}
                                        placeholder={
                                          watchedDiscountType === "PERCENTAGE"
                                            ? `${watchedDiscountValue}%`
                                            : `${watchedDiscountValue}`
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value.trim();
                                          const num = val === "" ? undefined : Math.max(0, Number(val));
                                          const updated = { ...watchedProductDiscounts };
                                          if (num === undefined || isNaN(num)) {
                                            delete updated[p.productId];
                                          } else {
                                            updated[p.productId] = num;
                                          }
                                          form.setValue("productDiscounts", updated, { shouldDirty: true });
                                        }}
                                        className="h-6.5 text-xs pl-5 pr-1 py-0 font-mono bg-background border-input shadow-2xs"
                                      />
                                    </div>
                                    {hasCustomDiscount && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...watchedProductDiscounts };
                                          delete updated[p.productId];
                                          form.setValue("productDiscounts", updated, { shouldDirty: true });
                                        }}
                                        className="text-[10px] text-muted-foreground hover:text-red-600 underline cursor-pointer"
                                        title="Revert to campaign default discount"
                                      >
                                        Use Default
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs font-medium ml-auto">
                                    <span className="text-muted-foreground text-[10px]">You save:</span>
                                    <strong className="text-red-600 font-bold font-mono">
                                      ₹{effectiveDiscount.toLocaleString("en-IN")}
                                    </strong>
                                    {hasCustomDiscount ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 font-bold tracking-tight">
                                        CUSTOM
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                        DEFAULT
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold whitespace-nowrap shadow-sm"
                >
                  {saveMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                  {editingCampaign ? "Save Changes" : "Create Campaign"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
