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
  Sliders, Eye, EyeOff
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
});

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
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

function AdminOffersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Auxiliary data for entity targeting selection
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: brands = [] } = useQuery(brandsQuery());
  const { data: products = [] } = useQuery(productListQuery());

  const { data: campaigns = [], isLoading } = useQuery(adminCampaignsQuery(statusFilter));

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
    });
    setActiveTab("basic");
    setIsModalOpen(true);
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
      startDate: c.startDate ? c.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: c.endDate ? c.endDate.slice(0, 16) : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
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
    });
    setActiveTab("basic");
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

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.couponCode && c.couponCode.toLowerCase().includes(q))
      );
    });
  }, [campaigns, searchQuery]);

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
                const isLive = c.isActive && new Date(c.startDate) <= new Date() && new Date(c.endDate) >= new Date();
                const isUpcoming = c.isActive && new Date(c.startDate) > new Date();
                const isExpired = new Date(c.endDate) < new Date();

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
                        {c.targetType === "CUSTOM_PRODUCTS" && `${c.productIds?.length || 0} Products`}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(c.startDate), "dd MMM")} - {format(new Date(c.endDate), "dd MMM yy")}</span>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Flame className="w-5 h-5 text-red-600" />
              {editingCampaign ? "Edit Campaign / Offer" : "Create New Campaign / Offer"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((v: any) => saveMutation.mutate(v))} className="space-y-6 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">1. Basic Info</TabsTrigger>
                <TabsTrigger value="media">2. Banners & Badges</TabsTrigger>
                <TabsTrigger value="discount">3. Discounts</TabsTrigger>
                <TabsTrigger value="targeting">4. Targeting</TabsTrigger>
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
                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                      Select Target Categories ({watchedCategoryIds.length} selected)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                      {categories.map((cat) => {
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
                              "flex items-center gap-2 p-2 rounded text-left text-xs transition-all border",
                              isSelected
                                ? "bg-red-50 border-red-300 text-red-900 font-bold dark:bg-red-950/40 dark:text-red-300"
                                : "bg-card border-border/60 hover:bg-muted text-foreground"
                            )}
                          >
                            <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border", isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground/40")}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="truncate">{cat.categoryName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TARGET = BRANDS */}
                {watchedTargetType === "BRANDS" && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                      Select Target Brands ({watchedBrandIds.length} selected)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                      {brands.map((b) => {
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
                              "flex items-center gap-2 p-2 rounded text-left text-xs transition-all border",
                              isSelected
                                ? "bg-red-50 border-red-300 text-red-900 font-bold dark:bg-red-950/40 dark:text-red-300"
                                : "bg-card border-border/60 hover:bg-muted text-foreground"
                            )}
                          >
                            <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border", isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground/40")}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="truncate">{b.brandName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TARGET = CUSTOM PRODUCTS */}
                {watchedTargetType === "CUSTOM_PRODUCTS" && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                      Select Handpicked Products ({watchedProductIds.length} selected)
                    </Label>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                      {products.map((p) => {
                        const isSelected = watchedProductIds.includes(p.productId);
                        return (
                          <button
                            key={p.productId}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? watchedProductIds.filter((id) => id !== p.productId)
                                : [...watchedProductIds, p.productId];
                              form.setValue("productIds", updated);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded text-left text-xs transition-all border",
                              isSelected
                                ? "bg-red-50 border-red-300 text-red-900 font-bold dark:bg-red-950/40 dark:text-red-300"
                                : "bg-card border-border/60 hover:bg-muted text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0", isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground/40")}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="truncate">{p.productName}</span>
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground shrink-0 ml-2">
                              ₹{p.productPrice.toLocaleString()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
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
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
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
