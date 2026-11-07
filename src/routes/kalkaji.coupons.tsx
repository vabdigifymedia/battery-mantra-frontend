import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { couponsService } from "@/services/coupons.service";
import { categoriesQuery, brandsQuery, productListQuery } from "@/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/Spinner";
import {
  Trash2,
  Plus,
  Edit,
  Ticket,
  Sparkles,
  Layers,
  ShieldCheck,
  Search,
  Check,
  X,
  Eye,
  Sliders,
} from "lucide-react";
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
import type { CouponResponse, CouponRequest, DiscountType, CouponTargetType } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kalkaji/coupons")({
  component: AdminCoupons,
});

const couponSchema = z.object({
  code: z.string().trim().min(3, "Code must be at least 3 characters").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.coerce.number().min(0, "Value must be positive"),
  maxDiscountAmount: z.coerce.number().optional().nullable(),
  minOrderValue: z.coerce.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().optional().nullable(),
  isActive: z.boolean(),
  isForever: z.boolean(),

  // Targeting fields
  targetType: z.enum(["ALL_PRODUCTS", "CATEGORIES", "BRANDS", "CUSTOM_PRODUCTS", "EXCLUDED_PRODUCTS"]),
  targetCategoryIds: z.array(z.string()).default([]),
  targetBrandIds: z.array(z.string()).default([]),
  targetProductIds: z.array(z.string()).default([]),
  excludedProductIds: z.array(z.string()).default([]),
  displayOnPdp: z.boolean().default(true),
  pdpHighlightText: z.string().optional().nullable(),
});

function AdminCoupons() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => couponsService.getAllAdminCoupons(),
  });

  const { data: allCategories = [] } = useQuery(categoriesQuery());
  const { data: allBrands = [] } = useQuery(brandsQuery());
  const { data: allProducts = [] } = useQuery(productListQuery());

  const form = useForm<z.infer<typeof couponSchema>>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: "",
      discountType: "FLAT",
      discountValue: 0,
      isActive: true,
      maxDiscountAmount: null,
      minOrderValue: null,
      usageLimit: null,
      startDate: null,
      expiryDate: null,
      isForever: true,
      targetType: "ALL_PRODUCTS",
      targetCategoryIds: [],
      targetBrandIds: [],
      targetProductIds: [],
      excludedProductIds: [],
      displayOnPdp: true,
      pdpHighlightText: "",
    },
  });

  const isForever = form.watch("isForever");
  const targetType = form.watch("targetType");
  const selectedCategoryIds = form.watch("targetCategoryIds") || [];
  const selectedBrandIds = form.watch("targetBrandIds") || [];
  const selectedProductIds = form.watch("targetProductIds") || [];
  const excludedProductIds = form.watch("excludedProductIds") || [];

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setProductSearch("");
    form.reset();
  };

  const openEditModal = (coupon: CouponResponse) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      minOrderValue: coupon.minOrderValue ?? null,
      usageLimit: coupon.usageLimit ?? null,
      isActive: coupon.isActive,
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : null,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : null,
      isForever: !coupon.startDate && !coupon.expiryDate,
      targetType: coupon.targetType || "ALL_PRODUCTS",
      targetCategoryIds: coupon.targetCategoryIds || [],
      targetBrandIds: coupon.targetBrandIds || [],
      targetProductIds: coupon.targetProductIds || [],
      excludedProductIds: coupon.excludedProductIds || [],
      displayOnPdp: coupon.displayOnPdp ?? true,
      pdpHighlightText: coupon.pdpHighlightText || "",
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    form.reset({
      code: "",
      discountType: "FLAT",
      discountValue: 0,
      isActive: true,
      maxDiscountAmount: null,
      minOrderValue: null,
      usageLimit: null,
      startDate: null,
      expiryDate: null,
      isForever: true,
      targetType: "ALL_PRODUCTS",
      targetCategoryIds: [],
      targetBrandIds: [],
      targetProductIds: [],
      excludedProductIds: [],
      displayOnPdp: true,
      pdpHighlightText: "",
    });
    setIsModalOpen(true);
  };

  const addMutation = useMutation({
    mutationFn: (data: CouponRequest) => couponsService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon created successfully");
      closeModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to create coupon");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CouponRequest }) =>
      couponsService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon updated successfully");
      closeModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon deleted successfully");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to delete coupon");
    },
  });

  // Filter products for custom / exclude selector
  const filteredProductsList = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 8);
    const q = productSearch.toLowerCase();
    return allProducts
      .filter((p) => p.productName.toLowerCase().includes(q) || p.brandName?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allProducts, productSearch]);

  const onSubmit = form.handleSubmit((values) => {
    // Resolve display names for categories and brands
    const targetCategoryNames = (values.targetCategoryIds || []).map(
      (id: string) => allCategories.find((c) => (c.categoryId || (c as any).id) === id)?.categoryName || id
    );

    const targetBrandNames = (values.targetBrandIds || []).map(
      (id: string) => allBrands.find((b) => (b.brandId || (b as any).id) === id)?.brandName || id
    );

    const req: CouponRequest = {
      code: values.code,
      discountType: values.discountType as DiscountType,
      discountValue: values.discountValue,
      maxDiscountAmount: values.maxDiscountAmount || undefined,
      minOrderValue: values.minOrderValue || undefined,
      usageLimit: values.usageLimit || undefined,
      isActive: values.isActive,
      startDate: values.isForever || !values.startDate ? undefined : new Date(values.startDate).toISOString(),
      expiryDate: values.isForever || !values.expiryDate ? undefined : new Date(values.expiryDate).toISOString(),

      // Targeting & PDP settings
      targetType: values.targetType,
      targetCategoryIds: values.targetCategoryIds,
      targetCategoryNames,
      targetBrandIds: values.targetBrandIds,
      targetBrandNames,
      targetProductIds: values.targetProductIds,
      excludedProductIds: values.excludedProductIds,
      displayOnPdp: values.displayOnPdp,
      pdpHighlightText: values.pdpHighlightText || undefined,
    };

    if (editingCoupon) {
      editMutation.mutate({ id: editingCoupon.couponId, data: req });
    } else {
      addMutation.mutate(req);
    }
  });

  const getTargetScopeBadge = (coupon: CouponResponse) => {
    const t = coupon.targetType || "ALL_PRODUCTS";
    switch (t) {
      case "CATEGORIES":
        return (
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            <Layers className="h-3 w-3 mr-1" />
            {coupon.targetCategoryNames?.length ? coupon.targetCategoryNames.join(", ") : "Specific Categories"}
          </Badge>
        );
      case "BRANDS":
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            {coupon.targetBrandNames?.length ? coupon.targetBrandNames.join(", ") : "Specific Brands"}
          </Badge>
        );
      case "CUSTOM_PRODUCTS":
        return (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            {coupon.targetProductIds?.length || 0} Specific Products
          </Badge>
        );
      case "EXCLUDED_PRODUCTS":
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Except {coupon.excludedProductIds?.length || 0} Products
          </Badge>
        );
      case "ALL_PRODUCTS":
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            All Products
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons &amp; Offers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage discount codes, product-level targeting, and product page (PDP) offers without campaigns.
          </p>
        </div>
        <Button onClick={openAddModal} variant="brand" className="shrink-0 shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Coupon Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Targeting / Eligibility</TableHead>
              <TableHead>Limits &amp; Min Order</TableHead>
              <TableHead>Product Page Display</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Spinner size="lg" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No coupons found. Click "Add Coupon" to create one.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.couponId}>
                  <TableCell>
                    <div className="font-bold flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-emerald-600" />
                      <span className="font-mono">{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-emerald-600">
                      {coupon.discountType === "FLAT" ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`}
                    </div>
                    {coupon.maxDiscountAmount && (
                      <div className="text-xs text-muted-foreground">Max ₹{coupon.maxDiscountAmount}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getTargetScopeBadge(coupon)}
                  </TableCell>
                  <TableCell>
                    {coupon.minOrderValue && <div className="text-xs">Min Order: ₹{coupon.minOrderValue}</div>}
                    {coupon.usageLimit && <div className="text-xs">Max Uses: {coupon.usageLimit}</div>}
                    {!coupon.minOrderValue && !coupon.usageLimit && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.displayOnPdp !== false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Eye className="h-3 w-3" /> Visible on PDP
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Hidden from PDP</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the coupon "{coupon.code}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(coupon.couponId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5 pt-3">
            {/* Core Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Coupon Code" htmlFor="code" required error={form.formState.errors.code?.message}>
                <Input id="code" {...form.register("code")} placeholder="e.g. BM200" className="uppercase font-mono font-bold" />
              </FormField>

              <FormField label="Discount Type" htmlFor="discountType" required error={form.formState.errors.discountType?.message}>
                <select
                  {...form.register("discountType")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="FLAT">Flat Amount (₹)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Discount Value" htmlFor="discountValue" required error={form.formState.errors.discountValue?.message}>
                <Input id="discountValue" type="number" step="1" {...form.register("discountValue")} placeholder="e.g. 200" />
              </FormField>

              <FormField label="Min Order Value (₹)" htmlFor="minOrderValue" error={form.formState.errors.minOrderValue?.message}>
                <Input id="minOrderValue" type="number" step="1" {...form.register("minOrderValue")} placeholder="e.g. 2500" />
              </FormField>

              <FormField label="Max Discount (₹)" htmlFor="maxDiscountAmount" error={form.formState.errors.maxDiscountAmount?.message}>
                <Input id="maxDiscountAmount" type="number" step="1" {...form.register("maxDiscountAmount")} placeholder="Optional" />
              </FormField>
            </div>

            {/* TARGETING & ELIGIBILITY SECTION */}
            <div className="rounded-xl border p-4 bg-muted/20 space-y-3.5">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Product Eligibility &amp; Targeting</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Control which products, brands, or categories this coupon can be applied to.
              </p>

              <FormField label="Applies To" htmlFor="targetType">
                <select
                  {...form.register("targetType")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                >
                  <option value="ALL_PRODUCTS">🌐 All Store Products (Universal)</option>
                  <option value="CATEGORIES">📁 Specific Categories (e.g. Only Car Batteries)</option>
                  <option value="BRANDS">🏷️ Specific Brands (e.g. Only Exide or Amaron)</option>
                  <option value="CUSTOM_PRODUCTS">🎯 Specific Battery Models (Whitelist)</option>
                  <option value="EXCLUDED_PRODUCTS">⛔ Exclude Specific Products (Blacklist)</option>
                </select>
              </FormField>

              {/* Category Selector */}
              {targetType === "CATEGORIES" && (
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-medium">Select Eligible Categories:</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border rounded-md bg-background">
                    {allCategories.map((cat) => {
                      const id = cat.categoryId || (cat as any).id;
                      const isSelected = selectedCategoryIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? selectedCategoryIds.filter((x) => x !== id)
                              : [...selectedCategoryIds, id];
                            form.setValue("targetCategoryIds", updated);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-surface text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {cat.categoryName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Brand Selector */}
              {targetType === "BRANDS" && (
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-medium">Select Eligible Brands:</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border rounded-md bg-background">
                    {allBrands.map((b) => {
                      const id = b.brandId || (b as any).id;
                      const isSelected = selectedBrandIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? selectedBrandIds.filter((x) => x !== id)
                              : [...selectedBrandIds, id];
                            form.setValue("targetBrandIds", updated);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-surface text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {b.brandName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specific Products / Excluded Products Selector */}
              {(targetType === "CUSTOM_PRODUCTS" || targetType === "EXCLUDED_PRODUCTS") && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">
                      {targetType === "CUSTOM_PRODUCTS" ? "Select Whitelisted Products:" : "Select Excluded Products:"}
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {(targetType === "CUSTOM_PRODUCTS" ? selectedProductIds.length : excludedProductIds.length)} selected
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search batteries by name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border rounded-md bg-background p-1 divide-y text-xs">
                    {filteredProductsList.map((p) => {
                      const activeList = targetType === "CUSTOM_PRODUCTS" ? selectedProductIds : excludedProductIds;
                      const isSelected = activeList.includes(p.productId);

                      return (
                        <div
                          key={p.productId}
                          onClick={() => {
                            const updated = isSelected
                              ? activeList.filter((id) => id !== p.productId)
                              : [...activeList, p.productId];
                            form.setValue(
                              targetType === "CUSTOM_PRODUCTS" ? "targetProductIds" : "excludedProductIds",
                              updated
                            );
                          }}
                          className={cn(
                            "flex items-center justify-between p-1.5 rounded cursor-pointer hover:bg-muted/60 transition-colors",
                            isSelected && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="block truncate font-medium">{p.productName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ₹{p.productPrice} • {p.brandName} • {p.capacity || p.capacityAh || ""}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* PDP DISPLAY SETTINGS */}
            <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-emerald-600" />
                    Product Page (PDP) Display
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Show in the "Available Coupons &amp; Offers" box on eligible products without needing campaigns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="displayOnPdp"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register("displayOnPdp")}
                />
              </div>

              <FormField label="Offer Headline / Custom Tag" htmlFor="pdpHighlightText">
                <Input
                  id="pdpHighlightText"
                  placeholder="e.g. Special Online Discount, Flat ₹200 OFF"
                  {...form.register("pdpHighlightText")}
                  className="text-xs h-8"
                />
              </FormField>
            </div>

            {/* Dates & Lifetime */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <input
                type="checkbox"
                id="isForever"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...form.register("isForever")}
              />
              <label htmlFor="isForever" className="text-xs font-medium text-foreground">
                Lifetime Coupon (No start or expiry date)
              </label>
            </div>

            {!isForever && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" htmlFor="startDate" error={form.formState.errors.startDate?.message}>
                  <Input id="startDate" type="date" {...form.register("startDate")} className="text-xs" />
                </FormField>

                <FormField label="Expiry Date" htmlFor="expiryDate" error={form.formState.errors.expiryDate?.message}>
                  <Input id="expiryDate" type="date" {...form.register("expiryDate")} className="text-xs" />
                </FormField>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Usage Limit" htmlFor="usageLimit" error={form.formState.errors.usageLimit?.message}>
                <Input id="usageLimit" type="number" {...form.register("usageLimit")} placeholder="Optional uses" className="text-xs" />
              </FormField>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register("isActive")}
                />
                <label htmlFor="isActive" className="text-xs font-medium text-foreground">
                  Active (Ready to redeem)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {addMutation.isPending || editMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
