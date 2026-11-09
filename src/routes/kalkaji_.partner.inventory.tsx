import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { categoriesQuery, brandsQuery } from "@/queries";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { productsService } from "@/services/products.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Package,
  MapPin,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ProductListResponse, CityDto } from "@/types/dto";

const LOW_STOCK_THRESHOLD = 5;
const PAGE_SIZE = 15;

export const Route = createFileRoute("/kalkaji_/partner/inventory")({
  component: PartnerInventoryPage,
});

export function PartnerInventoryPage() {
  const queryClient = useQueryClient();

  // Partner Profile Query (Strict Operating City Enforcement)
  const { data: partnerProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: ({ signal }) => partnerDashboardService.getMyProfile(signal),
  });

  const operatingCities: CityDto[] = partnerProfile?.operatingCities || [];
  const hasOperatingCities = operatingCities.length > 0;

  // Selected Operating City
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  useEffect(() => {
    if (operatingCities.length > 0 && !selectedCityId) {
      setSelectedCityId(operatingCities[0].cityId);
    }
  }, [operatingCities, selectedCityId]);

  const currentCity = useMemo(() => {
    return operatingCities.find((c) => c.cityId === selectedCityId) || operatingCities[0];
  }, [operatingCities, selectedCityId]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Staged inline edits: Record<productId, editedStockNumber>
  const [stagedStock, setStagedStock] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Products Query for Selected City
  const {
    data: rawProducts = [],
    isLoading: loadingProducts,
    isFetching: fetchingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["partner", "inventory", selectedCityId],
    queryFn: ({ signal }) => productsService.list(selectedCityId, signal),
    enabled: !!selectedCityId,
    staleTime: 10_000,
  });

  const { data: rawCategories = [] } = useQuery(categoriesQuery());
  const { data: rawBrands = [] } = useQuery(brandsQuery());

  const categories = useMemo(() => (Array.isArray(rawCategories) ? rawCategories : []), [rawCategories]);
  const brands = useMemo(() => (Array.isArray(rawBrands) ? rawBrands : []), [rawBrands]);
  const products: ProductListResponse[] = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts : []),
    [rawProducts]
  );

  // Metrics summary scoped to this branch city
  const summary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const stock = stagedStock[p.productId] !== undefined ? stagedStock[p.productId] : (p.productStock ?? 0);
      if (stock === 0) {
        outOfStock++;
      } else if (stock <= LOW_STOCK_THRESHOLD) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [products, stagedStock]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const currentStock =
        stagedStock[p.productId] !== undefined ? stagedStock[p.productId] : (p.productStock ?? 0);

      // Status Filter
      if (statusFilter === "IN_STOCK" && currentStock <= LOW_STOCK_THRESHOLD) return false;
      if (statusFilter === "LOW_STOCK" && (currentStock === 0 || currentStock > LOW_STOCK_THRESHOLD)) return false;
      if (statusFilter === "OUT_OF_STOCK" && currentStock !== 0) return false;

      // Category Filter
      if (selectedCategory !== "ALL" && p.productCategory !== selectedCategory && p.categoryId !== selectedCategory) {
        return false;
      }

      // Brand Filter
      if (selectedBrand !== "ALL" && p.brandName !== selectedBrand) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (p.productName || "").toLowerCase().includes(q);
        const brandMatch = (p.brandName || "").toLowerCase().includes(q);
        const capacityMatch = (p.capacity || p.capacityAh || "").toLowerCase().includes(q);
        if (!nameMatch && !brandMatch && !capacityMatch) return false;
      }

      return true;
    });
  }, [products, stagedStock, statusFilter, selectedCategory, selectedBrand, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Single Item Stock Mutation
  const singleUpdateMutation = useMutation({
    mutationFn: async ({
      productId,
      newStock,
      price,
      discount,
    }: {
      productId: string;
      newStock: number;
      price?: number;
      discount?: number;
    }) => {
      if (!selectedCityId) throw new Error("No branch city selected");
      setUpdatingId(productId);
      return partnerDashboardService.updateBranchStock(productId, selectedCityId, newStock, price, discount);
    },
    onSuccess: (_, variables) => {
      toast.success("Branch stock updated successfully");
      setStagedStock((prev) => {
        const next = { ...prev };
        delete next[variables.productId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["partner", "inventory", selectedCityId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update branch stock");
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  // Bulk Stock Mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (
      updates: Array<{ productId: string; stock: number; price?: number; exchangeDiscount?: number }>
    ) => {
      if (!selectedCityId) throw new Error("No branch city selected");
      return partnerDashboardService.bulkUpdateBranchStock(selectedCityId, updates);
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.length} products stock saved for ${currentCity?.cityName || "branch"}!`);
      setStagedStock({});
      queryClient.invalidateQueries({ queryKey: ["partner", "inventory", selectedCityId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save branch inventory changes");
    },
  });

  const handleStockChange = (productId: string, val: number) => {
    const cleanVal = Math.max(0, isNaN(val) ? 0 : val);
    setStagedStock((prev) => ({
      ...prev,
      [productId]: cleanVal,
    }));
  };

  const handleSaveSingle = (p: ProductListResponse) => {
    const targetStock = stagedStock[p.productId];
    if (targetStock === undefined) return;
    singleUpdateMutation.mutate({
      productId: p.productId,
      newStock: targetStock,
      price: p.productPrice,
      discount: p.exchangeDiscount,
    });
  };

  const handleSaveAll = () => {
    const updates = Object.entries(stagedStock).map(([productId, stock]) => {
      const prod = products.find((p) => p.productId === productId);
      return {
        productId,
        stock,
        price: prod?.productPrice,
        exchangeDiscount: prod?.exchangeDiscount,
      };
    });
    if (updates.length === 0) return;
    bulkUpdateMutation.mutate(updates);
  };

  const handleDiscardAll = () => {
    setStagedStock({});
    toast.info("Unsaved branch stock changes discarded");
  };

  const hasUnsavedChanges = Object.keys(stagedStock).length > 0;

  // Render Zero Operating Cities Alert
  if (!loadingProfile && !hasOperatingCities) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="p-4 bg-amber-100 dark:bg-amber-950/50 rounded-full text-amber-600 mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">No Operating Branches Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          Your partner account currently has no operating cities assigned. Inventory viewing and stock management are
          strictly isolated to registered branch cities.
        </p>
        <p className="text-xs text-muted-foreground mt-4 border border-dashed p-3 rounded-lg bg-muted/40">
          Please contact Super Admin to assign your branch locations (e.g., Delhi NCR, Noida).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 relative min-h-screen">
      {/* Top Header & Operating Branch Badge/Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Branch Inventory Control</h1>
                <Badge variant="secondary" className="text-[11px] font-semibold bg-blue-100/70 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  City-Isolated
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Real-time local stock tracking for your branch. Changes immediately update local delivery availability.
              </p>
            </div>
          </div>
        </div>

        {/* Branch City Selector / Locked Badge */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {operatingCities.length === 1 ? (
            // Single City: Hardcoded & Locked Badge
            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl shadow-xs text-xs font-semibold">
              <MapPin className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
              <span>Operating Branch:</span>
              <span className="font-bold underline decoration-emerald-400">{currentCity?.cityName}</span>
              <Badge variant="outline" className="text-[10px] ml-1 py-0 h-4 border-slate-700 dark:border-slate-300">
                Locked
              </Badge>
            </div>
          ) : operatingCities.length > 1 ? (
            // Multi-City Franchise: Dropdown restricted strictly to operatingCities
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Switch Branch:</span>
              <Select
                value={selectedCityId}
                onValueChange={(val) => {
                  setSelectedCityId(val);
                  setStagedStock({});
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs font-bold border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                  <SelectValue placeholder="Select operating branch" />
                </SelectTrigger>
                <SelectContent>
                  {operatingCities.map((c) => (
                    <SelectItem key={c.cityId} value={c.cityId} className="text-xs font-semibold">
                      {c.cityName} {c.stateName ? `(${c.stateName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProducts()}
            disabled={fetchingProducts}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fetchingProducts ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Branch SKUs */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
            statusFilter === "ALL" ? "border-l-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20" : "border-l-blue-500"
          }`}
          onClick={() => {
            setStatusFilter("ALL");
            setCurrentPage(1);
          }}
        >
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Branch SKUs
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{summary.total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Active in {currentCity?.cityName || "branch"}
            </p>
          </CardContent>
        </Card>

        {/* In Stock */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
            statusFilter === "IN_STOCK"
              ? "border-l-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20"
              : "border-l-emerald-500"
          }`}
          onClick={() => {
            setStatusFilter("IN_STOCK");
            setCurrentPage(1);
          }}
        >
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              In Stock
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {summary.inStock}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">&gt; {LOW_STOCK_THRESHOLD} units available</p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
            statusFilter === "LOW_STOCK"
              ? "border-l-amber-600 ring-2 ring-amber-500/20 bg-amber-50/30"
              : "border-l-amber-500"
          }`}
          onClick={() => {
            setStatusFilter("LOW_STOCK");
            setCurrentPage(1);
          }}
        >
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Low Stock</span>
              {summary.lowStock > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">
              {summary.lowStock}
            </div>
            <p className="text-[11px] text-amber-700/80 mt-1">
              &le; {LOW_STOCK_THRESHOLD} units (Re-stock soon)
            </p>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
            statusFilter === "OUT_OF_STOCK"
              ? "border-l-red-600 ring-2 ring-red-500/20 bg-red-50/30"
              : "border-l-red-500"
          }`}
          onClick={() => {
            setStatusFilter("OUT_OF_STOCK");
            setCurrentPage(1);
          }}
        >
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider">
              Out of Stock
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-red-700 dark:text-red-400">
              {summary.outOfStock}
            </div>
            <p className="text-[11px] text-red-700/80 mt-1">
              0 units in {currentCity?.cityName || "branch"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-4 space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {[
              { id: "ALL", label: `All Items (${summary.total})` },
              { id: "IN_STOCK", label: `In Stock (${summary.inStock})`, color: "text-emerald-700" },
              {
                id: "LOW_STOCK",
                label: `Low Stock ≤${LOW_STOCK_THRESHOLD} (${summary.lowStock})`,
                color: "text-amber-700",
              },
              { id: "OUT_OF_STOCK", label: `Out of Stock (${summary.outOfStock})`, color: "text-red-700" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`text-xs h-8 ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                    : tab.color || ""
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Search and Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search battery name, brand, or Ah..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <div>
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.categoryId} value={c.categoryName || c.categoryId}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={selectedBrand}
                onValueChange={(val) => {
                  setSelectedBrand(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.brandId} value={b.brandName}>
                      {b.brandName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Inventory Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px] pl-4">Photo</TableHead>
                <TableHead className="min-w-[260px]">Product & Specs</TableHead>
                <TableHead className="min-w-[110px]">Category</TableHead>
                <TableHead className="w-[110px]">Branch Price</TableHead>
                <TableHead className="w-[140px]">Branch Status</TableHead>
                <TableHead className="w-[240px] text-center">Local Stock Stepper</TableHead>
                <TableHead className="w-[120px] text-right pr-4">Quick Zero</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadingProducts || loadingProfile ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Spinner size="lg" className="inline-block mr-2" />
                    <span className="text-muted-foreground text-sm">Loading branch inventory...</span>
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No products found matching filters in {currentCity?.cityName || "your branch"}.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p) => {
                  const originalStock = p.productStock ?? 0;
                  const isStaged = stagedStock[p.productId] !== undefined;
                  const currentStock = isStaged ? stagedStock[p.productId] : originalStock;
                  const isUpdating = updatingId === p.productId || singleUpdateMutation.isPending;

                  const isOutOfStock = currentStock === 0;
                  const isLowStock = currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD;

                  return (
                    <TableRow
                      key={p.productId}
                      className={`hover:bg-muted/40 transition-colors ${
                        isStaged ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <TableCell className="pl-4">
                        {p.productImage ? (
                          <img
                            src={p.productImage}
                            alt={p.productName}
                            className="h-10 w-10 rounded-md object-contain border bg-white p-0.5"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </TableCell>

                      {/* Name & Specs */}
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm line-clamp-2 leading-snug" title={p.productName}>
                            {p.productName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {p.brandName && (
                              <span className="inline-flex items-center text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                {p.brandName}
                              </span>
                            )}
                            {(p.capacity || p.capacityAh) && (
                              <span className="inline-flex items-center text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200/50">
                                {p.capacity || p.capacityAh}
                              </span>
                            )}
                            {p.warranty && (
                              <span className="inline-flex items-center text-[10px] text-muted-foreground">
                                {p.warranty}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {p.productCategory || "General"}
                      </TableCell>

                      {/* Branch Price */}
                      <TableCell className="text-sm font-semibold">
                        ₹{p.productPrice?.toLocaleString("en-IN")}
                        {p.exchangeDiscount ? (
                          <p className="text-[10px] font-normal text-emerald-600">
                            -₹{p.exchangeDiscount} Exch.
                          </p>
                        ) : null}
                      </TableCell>

                      {/* Stock Status Badge */}
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="outline" className="border-red-400 bg-red-50 text-red-700 text-xs gap-1 font-bold">
                            <XCircle className="h-3.5 w-3.5 text-red-600" /> Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-xs gap-1 font-bold animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Low ({currentStock})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-800 text-xs gap-1 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> In Stock ({currentStock})
                          </Badge>
                        )}
                      </TableCell>

                      {/* Inline Stock Stepper & Input */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Decrement Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-md hover:bg-muted"
                            onClick={() => handleStockChange(p.productId, currentStock - 1)}
                            disabled={currentStock <= 0}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>

                          {/* Editable Number Input */}
                          <Input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => handleStockChange(p.productId, parseInt(e.target.value) || 0)}
                            className={`w-18 h-8 text-center text-sm font-bold font-mono ${
                              isStaged
                                ? "border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400/30"
                                : isOutOfStock
                                ? "border-red-300 text-red-700 bg-red-50/30"
                                : isLowStock
                                ? "border-amber-300 text-amber-800 bg-amber-50/30"
                                : "border-border text-foreground"
                            }`}
                          />

                          {/* Increment Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-md hover:bg-muted"
                            onClick={() => handleStockChange(p.productId, currentStock + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>

                          {/* Single Save Button (Appears if edited) */}
                          {isStaged && (
                            <Button
                              type="button"
                              size="icon"
                              variant="default"
                              onClick={() => handleSaveSingle(p)}
                              disabled={isUpdating}
                              title="Save stock for this battery"
                              className="h-8 w-8 shrink-0 bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-xs animate-bounce"
                            >
                              {updatingId === p.productId ? (
                                <Spinner size="sm" className="text-white" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>

                      {/* Quick Out-Of-Stock Toggle */}
                      <TableCell className="text-right pr-4">
                        {currentStock > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStockChange(p.productId, 0)}
                            className="text-[11px] h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2"
                          >
                            Set 0
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono">Stocked 0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} items
            </span>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <PaginationItem className="text-xs text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Floating Bottom Bulk Action Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white dark:bg-white dark:text-slate-900 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 border border-slate-800 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800 dark:border-slate-200">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs sm:text-sm font-semibold">
              {Object.keys(stagedStock).length} modified batteries in{" "}
              <span className="text-amber-400 dark:text-amber-600 font-bold">{currentCity?.cityName}</span>
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDiscardAll}
            disabled={bulkUpdateMutation.isPending}
            className="text-xs h-8 text-slate-400 hover:text-white dark:hover:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Discard
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={bulkUpdateMutation.isPending}
            className="text-xs h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md gap-1"
          >
            {bulkUpdateMutation.isPending ? (
              <Spinner size="sm" className="text-slate-950" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save All Changes
          </Button>
        </div>
      )}
    </div>
  );
}

