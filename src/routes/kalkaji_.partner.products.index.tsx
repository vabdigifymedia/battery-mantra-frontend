import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { productListQuery } from "@/queries";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Tag, Search, Clock, CheckCircle, Package, MapPin, AlertTriangle } from "lucide-react";
import type { ProductListResponse, CityPricingDto, CityDto } from "@/types/dto";

export const Route = createFileRoute("/kalkaji_/partner/products/")({
  component: PartnerProductsPage,
});

// --- Types for pending price requests (client-side MVP tracking) ---
type PendingPriceRequest = {
  cityId: string;
  price: number;
  exchangeDiscount?: number;
  stock: number;
  reason: string;
};

function PartnerProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<ProductListResponse | null>(null);

  // Queries
  const { data: products = [], isLoading } = useQuery(productListQuery());

  // City Pricing Form State
  const [cityPrice, setCityPrice] = useState("");
  const [exchangeDiscount, setExchangeDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [priceChangeReason, setPriceChangeReason] = useState("");

  // Pending price requests (client-side MVP tracking)
  const [pendingRequests, setPendingRequests] = useState<Map<string, PendingPriceRequest>>(new Map());

  // Quick stock toggle — optimistic local stock state
  const [localStockOverrides, setLocalStockOverrides] = useState<Map<string, boolean>>(new Map());

  // Get partner profile to fetch operating cities
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: ({ signal }) => partnerDashboardService.getMyProfile(signal),
  });

  const operatingCities: CityDto[] = useMemo(
    () => partnerProfile?.operatingCities || [],
    [partnerProfile?.operatingCities]
  );
  const hasOperatingCities = operatingCities.length > 0;

  // --- Mutations ---

  // Direct stock-only update (no approval needed)
  const updateCityPricingMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: CityPricingDto }) =>
      partnerDashboardService.updateCityPricing(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("City price updated successfully!");
      setSelectedProductForPricing(null);
      setPriceChangeReason("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update city pricing. Ensure city is in your branch operating cities.");
    },
  });

  // Price change approval request
  const requestPricingChangeMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: { cityId: string; price: number; exchangeDiscount?: number; stock: number; reason: string } }) =>
      partnerDashboardService.requestCityPricingChange(productId, data),
    onSuccess: (_data, variables) => {
      toast.success("Price change request submitted for Admin approval");
      setPendingRequests((prev) => {
        const next = new Map(prev);
        next.set(variables.productId, {
          cityId: variables.data.cityId,
          price: variables.data.price,
          exchangeDiscount: variables.data.exchangeDiscount,
          stock: variables.data.stock,
          reason: variables.data.reason,
        });
        return next;
      });
      setSelectedProductForPricing(null);
      setPriceChangeReason("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit price change request.");
    },
  });

  // Quick stock toggle mutation
  const stockToggleMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: CityPricingDto }) =>
      partnerDashboardService.updateCityPricing(productId, data),
    onSuccess: (_data, variables) => {
      const isInStock = variables.data.stock > 0;
      toast.success(isInStock ? "Product marked In Stock" : "Product marked Out of Stock");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any, variables) => {
      setLocalStockOverrides((prev) => {
        const next = new Map(prev);
        next.delete(variables.productId);
        return next;
      });
      toast.error(err?.message || "Failed to update stock status.");
    },
  });

  const handleOpenPricingModal = (product: ProductListResponse) => {
    setSelectedProductForPricing(product);
    setCityPrice(product.productPrice.toString());
    setExchangeDiscount((product.exchangeDiscount || 0).toString());
    setStock((product.productStock ?? 10).toString());
    setPriceChangeReason("");
    if (operatingCities.length > 0) {
      setSelectedCityId(operatingCities[0].cityId);
    } else {
      setSelectedCityId("");
    }
  };

  // --- Price Validation Helpers ---
  const priceValidation = useMemo(() => {
    if (!selectedProductForPricing || !cityPrice) return null;

    const basePrice = selectedProductForPricing.productPrice;
    const newPrice = parseFloat(cityPrice);
    const exchDisc = exchangeDiscount ? parseFloat(exchangeDiscount) : 0;

    if (isNaN(newPrice)) return null;

    const warnings: string[] = [];
    const errors: string[] = [];

    if (newPrice < 0) {
      errors.push("Price cannot be negative");
    }

    if (basePrice > 0) {
      const percentDiff = ((newPrice - basePrice) / basePrice) * 100;
      if (newPrice > basePrice * 1.2) {
        warnings.push(`⚠ Price is ${Math.round(percentDiff)}% above base price. This will require Admin review.`);
      } else if (newPrice < basePrice * 0.8) {
        warnings.push(`⚠ Price is ${Math.round(Math.abs(percentDiff))}% below base price. This will require Admin review.`);
      }
    }

    if (exchDisc > newPrice) {
      errors.push("Exchange discount cannot exceed the city price");
    }

    return { warnings, errors, hasErrors: errors.length > 0 };
  }, [selectedProductForPricing, cityPrice, exchangeDiscount]);

  const handleSaveCityPricing = () => {
    if (!selectedProductForPricing || !cityPrice) {
      toast.error("Please enter a valid price");
      return;
    }

    if (priceValidation?.hasErrors) {
      toast.error(priceValidation.errors[0]);
      return;
    }

    if (!priceChangeReason.trim()) {
      toast.error("Please provide a reason for the price change");
      return;
    }

    const targetCityId = selectedCityId || (operatingCities.length > 0 ? operatingCities[0].cityId : undefined);

    if (!targetCityId) {
      toast.error("No operating city available");
      return;
    }

    const newPrice = parseFloat(cityPrice);
    const exchDisc = exchangeDiscount ? parseFloat(exchangeDiscount) : 0;
    const stockCount = stock ? parseInt(stock, 10) : 0;

    requestPricingChangeMutation.mutate({
      productId: selectedProductForPricing.productId,
      data: {
        cityId: targetCityId,
        price: newPrice,
        exchangeDiscount: exchDisc,
        stock: stockCount,
        reason: priceChangeReason.trim(),
      },
    });
  };

  const handleStockToggle = useCallback(
    (product: ProductListResponse, newInStock: boolean) => {
      if (!hasOperatingCities) return;

      const firstCityId = operatingCities[0].cityId;

      setLocalStockOverrides((prev) => {
        const next = new Map(prev);
        next.set(product.productId, newInStock);
        return next;
      });

      stockToggleMutation.mutate({
        productId: product.productId,
        data: {
          cityId: firstCityId,
          price: product.productPrice,
          stock: newInStock ? 10 : 0,
        },
      });
    },
    [hasOperatingCities, operatingCities, stockToggleMutation]
  );

  const getProductStockStatus = useCallback(
    (product: ProductListResponse): boolean => {
      if (localStockOverrides.has(product.productId)) {
        return localStockOverrides.get(product.productId)!;
      }
      return (product.productStock ?? 0) > 0;
    },
    [localStockOverrides]
  );

  const pendingCount = useMemo(
    () => products.filter((p) => p.isApproved === false).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === "APPROVED" && p.isApproved === false) return false;
      if (statusFilter === "PENDING" && p.isApproved !== false) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.productName.toLowerCase().includes(q) ||
        (p.brandName && p.brandName.toLowerCase().includes(q)) ||
        (p.productCategory && p.productCategory.toLowerCase().includes(q)) ||
        (p.capacity && p.capacity.toLowerCase().includes(q))
      );
    });
  }, [products, statusFilter, search]);

  const isSavePricingDisabled =
    (!selectedCityId && operatingCities.length === 0) ||
    updateCityPricingMutation.isPending ||
    requestPricingChangeMutation.isPending;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products & City Pricing</h1>
            <p className="text-muted-foreground">
              Manage custom battery prices for your operating city or propose new products for Admin approval.
            </p>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link to="/kalkaji/partner/products/request">
              <Plus className="h-4 w-4" /> Request New Product
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, category, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: `All (${products.length})` },
              { id: "APPROVED", label: `Live Catalog (${products.length - pendingCount})` },
              { id: "PENDING", label: `Pending Approval (${pendingCount})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(tab.id as any)}
                className="text-xs h-8"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">Product</TableHead>
                <TableHead>Category & Brand</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Local Stock</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead className="text-right">City Price Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Spinner size="md" className="inline-block" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const isInStock = getProductStockStatus(product);
                  const pending = pendingRequests.get(product.productId);

                  return (
                    <TableRow key={product.productId} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.productImage ? (
                            <img
                              src={product.productImage}
                              alt={product.productName}
                              className="h-10 w-10 rounded object-cover border shrink-0 bg-white"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted border flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">{product.productName}</p>
                            {product.capacity && (
                              <p className="text-xs text-muted-foreground">Spec / R/L: {product.capacity}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{product.productCategory || "Uncategorized"}</p>
                        <p className="text-xs text-muted-foreground">{product.brandName || "Generic"}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-semibold text-foreground">
                          ₹{product.productPrice.toLocaleString()}
                        </p>
                        {pending && (
                          <Badge variant="outline" className="mt-1 text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                            ⏳ Requested: ₹{pending.price.toLocaleString()} (Pending Review)
                          </Badge>
                        )}
                      </TableCell>

                      {/* Quick Stock Toggle Column */}
                      <TableCell>
                        {hasOperatingCities ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isInStock}
                              onCheckedChange={(checked) => handleStockToggle(product, checked)}
                              disabled={stockToggleMutation.isPending}
                            />
                            <span className="text-xs font-medium whitespace-nowrap">
                              {isInStock ? (
                                <span className="text-emerald-600">🟢 In Stock</span>
                              ) : (
                                <span className="text-red-600">🔴 Out of Stock</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 opacity-50">
                                <Switch checked={false} disabled />
                                <span className="text-xs text-muted-foreground">N/A</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>No operating city assigned</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      <TableCell>
                        {product.isApproved === false ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasOperatingCities ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPricingModal(product)}
                            className="gap-1.5 text-xs"
                          >
                            <Tag className="h-3.5 w-3.5" /> Change City Price
                          </Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="gap-1.5 text-xs"
                                >
                                  <Tag className="h-3.5 w-3.5" /> Change City Price
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>No operating city assigned</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Set City Price Modal */}
        {selectedProductForPricing && (
          <Dialog open={!!selectedProductForPricing} onOpenChange={(open) => !open && setSelectedProductForPricing(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Set City-Specific Price
                </DialogTitle>
                <DialogDescription>
                  Customize product price and exchange discount for your operating city branch. Price changes require Admin approval.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                  <p className="font-semibold">{selectedProductForPricing.productName}</p>
                  <p className="text-xs text-muted-foreground">Default Base Price: ₹{selectedProductForPricing.productPrice.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Operating City</Label>
                  {operatingCities.length === 1 ? (
                    <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-700">{operatingCities[0].cityName} {operatingCities[0].stateName ? `(${operatingCities[0].stateName})` : ""}</p>
                        <p className="text-[11px] text-blue-600">Price changes will be applied to your branch city automatically.</p>
                      </div>
                    </div>
                  ) : operatingCities.length > 1 ? (
                    <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Select Operating City" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatingCities.map((c: any) => (
                          <SelectItem key={c.cityId} value={c.cityId}>
                            {c.cityName} {c.stateName ? `(${c.stateName})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-lg border bg-amber-500/10 border-amber-500/20 p-3 text-xs text-amber-700">
                      No operating city assigned to your partner account. Contact Admin to assign an operating city.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">City Price (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 4500"
                      value={cityPrice}
                      onChange={(e) => setCityPrice(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Exchange Discount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={exchangeDiscount}
                      onChange={(e) => setExchangeDiscount(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Price Validation Warnings & Errors */}
                {priceValidation && (
                  <>
                    {priceValidation.errors.map((err, i) => (
                      <div key={`err-${i}`} className="rounded-lg border bg-red-500/10 border-red-500/20 p-3 text-xs text-red-700 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                    {priceValidation.warnings.map((warn, i) => (
                      <div key={`warn-${i}`} className="rounded-lg border bg-yellow-500/10 border-yellow-500/20 p-3 text-xs text-yellow-700 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Local Stock Count</Label>
                  <Input
                    type="number"
                    placeholder="Available Units"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Reason for Price Change *</Label>
                  <Textarea
                    placeholder="e.g. Local market competition, increased supplier cost"
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    className="text-xs min-h-[80px]"
                    required
                  />
                  {!priceChangeReason.trim() && (
                    <p className="text-[11px] text-muted-foreground">Required — provide a reason before submitting.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProductForPricing(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCityPricing}
                  disabled={
                    isSavePricingDisabled ||
                    !priceChangeReason.trim() ||
                    (priceValidation?.hasErrors ?? false)
                  }
                >
                  {requestPricingChangeMutation.isPending ? "Submitting..." : "Submit Price Change Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
