import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { adminProductListQuery, categoriesQuery, brandsQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { locationService } from "@/services/location.service";
import { partnerService } from "@/services/partner.service";
import { productsService } from "@/services/products.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ExternalLink,
  Edit,
  IndianRupee,
  Layers,
  Tag,
  Package,
  MapPin,
  Warehouse,
  Building2,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ProductListResponse, CityDto } from "@/types/dto";

const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE = 15;

export const Route = createFileRoute("/kalkaji/inventory")({
  component: AdminInventoryPage,
});

export function AdminInventoryPage() {
  const queryClient = useQueryClient();

  // View Mode: Single Location vs Cross-City Matrix
  const [viewMode, setViewMode] = useState<"LOCATION" | "MATRIX">("LOCATION");

  // Selected Location: "CENTRAL" for Master Global Depot, or cityId for branch
  const [selectedLocation, setSelectedLocation] = useState<string>("CENTRAL");

  // Filter States
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Staged inline edits: Record<productId, editedStockNumber>
  const [stagedStock, setStagedStock] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Cities Query (For Location Selector & Multi-City Matrix)
  const { data: rawCities = [] } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: () => locationService.getAllCities(),
    staleTime: 60_000,
  });
  const cities: CityDto[] = useMemo(() => (Array.isArray(rawCities) ? rawCities : []), [rawCities]);

  // Partners Query (To show which partner manages the selected city)
  const { data: partners = [] } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: partnerService.getAll,
    staleTime: 30_000,
  });

  // Current City Object & Managing Partner
  const isCentral = selectedLocation === "CENTRAL";
  const currentCity = useMemo(() => {
    if (isCentral) return null;
    return cities.find((c) => c.cityId === selectedLocation) || null;
  }, [cities, selectedLocation, isCentral]);

  const currentCityPartner = useMemo(() => {
    if (isCentral || !selectedLocation) return null;
    return partners.find((p) => p.operatingCities?.some((c) => c.cityId === selectedLocation));
  }, [partners, selectedLocation, isCentral]);

  // Central Warehouse Products Query
  const centralProductsQuery = useQuery({
    ...adminProductListQuery(),
    staleTime: 10_000,
  });

  // Branch Products Query (Scoped to selected City)
  const cityProductsQuery = useQuery({
    queryKey: ["admin", "city-products", selectedLocation],
    queryFn: ({ signal }) => productsService.list(selectedLocation, signal),
    enabled: !isCentral,
    staleTime: 10_000,
  });

  const { data: rawCategories = [] } = useQuery(categoriesQuery());
  const { data: rawBrands = [] } = useQuery(brandsQuery());

  const categories = useMemo(() => (Array.isArray(rawCategories) ? rawCategories : []), [rawCategories]);
  const brands = useMemo(() => (Array.isArray(rawBrands) ? rawBrands : []), [rawBrands]);

  // Determine active products list based on selected location
  const activeProductsQuery = isCentral ? centralProductsQuery : cityProductsQuery;
  const rawProducts = activeProductsQuery.data || [];
  const loadingProducts = activeProductsQuery.isLoading;
  const fetchingProducts = activeProductsQuery.isFetching;
  const refetchProducts = () => activeProductsQuery.refetch();

  const products: ProductListResponse[] = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts : []),
    [rawProducts]
  );

  // Metrics summary scoped to active location
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

  // Single Item Stock Mutation (Supports both Central & City Stock)
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
      setUpdatingId(productId);
      if (isCentral) {
        return adminService.updateStock(productId, newStock, "Updated from Central Inventory Dashboard");
      } else {
        return adminService.updateCityStock(productId, selectedLocation, newStock, price, discount);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(
        isCentral
          ? "Central stock updated successfully"
          : `Branch stock updated for ${currentCity?.cityName || "city"}`
      );
      setStagedStock((prev) => {
        const next = { ...prev };
        delete next[variables.productId];
        return next;
      });
      queryClient.removeQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      if (!isCentral) {
        queryClient.invalidateQueries({ queryKey: ["admin", "city-products", selectedLocation] });
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update stock");
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  // Bulk Stock Mutation (Supports both Central & City Stock)
  const bulkUpdateMutation = useMutation({
    mutationFn: async (
      updates: Array<{ productId: string; stockQuantity: number; price?: number; exchangeDiscount?: number }>
    ) => {
      if (isCentral) {
        return adminService.bulkUpdateStock(updates);
      } else {
        return adminService.bulkUpdateCityStock(selectedLocation, updates);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(
        `${variables.length} products stock updated for ${
          isCentral ? "Central Warehouse" : currentCity?.cityName || "city"
        }!`
      );
      setStagedStock({});
      queryClient.removeQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      if (!isCentral) {
        queryClient.invalidateQueries({ queryKey: ["admin", "city-products", selectedLocation] });
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save bulk stock changes");
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
    const updates = Object.entries(stagedStock).map(([productId, stockQuantity]) => {
      const prod = products.find((p) => p.productId === productId);
      return {
        productId,
        stockQuantity,
        price: prod?.productPrice,
        exchangeDiscount: prod?.exchangeDiscount,
      };
    });
    if (updates.length === 0) return;
    bulkUpdateMutation.mutate(updates);
  };

  const handleDiscardAll = () => {
    setStagedStock({});
    toast.info("Unsaved stock changes discarded");
  };

  const hasUnsavedChanges = Object.keys(stagedStock).length > 0;

  return (
    <div className="space-y-6 pb-24 relative min-h-screen">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card border rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-xl text-red-600 dark:text-red-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Stock & Inventory Management</h1>
                <Badge variant="outline" className="text-[11px] font-semibold border-red-200 text-red-700 bg-red-50/50">
                  360° Admin Visibility
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage central warehouse depot stock or switch to city branch inventories with instant updates.
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls: Location Selector + View Toggle + Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Location Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Location:</span>
            <Select
              value={selectedLocation}
              onValueChange={(val) => {
                setSelectedLocation(val);
                setStagedStock({});
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[260px] h-9 text-xs font-bold border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20">
                {isCentral ? (
                  <Warehouse className="h-4 w-4 text-red-600 mr-2 shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
                )}
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CENTRAL" className="font-bold text-xs py-2 text-red-700">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-3.5 w-3.5 text-red-600" />
                    <span>Central Warehouse (Global Master Stock)</span>
                  </div>
                </SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.cityId} value={city.cityId} className="text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span>
                        {city.cityName} {city.stateName ? `(${city.stateName})` : ""} Branch
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "LOCATION" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("LOCATION")}
              className={`h-7 text-xs px-2.5 ${
                viewMode === "LOCATION" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold" : ""
              }`}
            >
              Branch Table
            </Button>
            <Button
              variant={viewMode === "MATRIX" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("MATRIX")}
              className={`h-7 text-xs px-2.5 ${
                viewMode === "MATRIX" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold" : ""
              }`}
            >
              Cross-City Matrix
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProducts()}
            disabled={fetchingProducts}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fetchingProducts ? "animate-spin text-red-600" : ""}`} />
            Refresh
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Link to="/kalkaji/quick-edit">
              <IndianRupee className="h-3.5 w-3.5" />
              Quick Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Selected City Branch Context Banner (Shown when a City is selected) */}
      {!isCentral && currentCity && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-700 dark:text-blue-300">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-blue-950 dark:text-blue-100">
                  Branch Inventory: {currentCity.cityName} {currentCity.stateName ? `(${currentCity.stateName})` : ""}
                </h3>
                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-white dark:bg-blue-900 text-[10px]">
                  City-Isolated Stock
                </Badge>
              </div>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                Updates here adjust local branch availability for {currentCity.cityName}. Central warehouse stock is not altered.
              </p>
            </div>
          </div>

          {currentCityPartner ? (
            <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 border px-3 py-1.5 rounded-lg shadow-xs">
              <span className="text-muted-foreground font-medium">Partner:</span>
              <span className="font-bold text-foreground">{currentCityPartner.businessName}</span>
              <span className="text-muted-foreground text-[11px] font-mono">({currentCityPartner.phoneNumber})</span>
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
              ⚠️ No Partner Assigned to {currentCity.cityName}
            </Badge>
          )}
        </div>
      )}

      {/* VIEW 1: Branch / Warehouse Inventory View */}
      {viewMode === "LOCATION" && (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total SKUs */}
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
                  Total SKUs
                </CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{summary.total}</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tracked in {isCentral ? "Central Warehouse" : `${currentCity?.cityName || "city"} branch`}
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
                <p className="text-[11px] text-emerald-700/80 mt-1">&gt; {LOW_STOCK_THRESHOLD} units ready</p>
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
                <p className="text-[11px] text-amber-700/80 mt-1">&le; {LOW_STOCK_THRESHOLD} units (Re-order soon)</p>
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
                <p className="text-[11px] text-red-700/80 mt-1">0 units in selected location</p>
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
                    placeholder="Search by product name, brand, or Ah capacity..."
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
                    <TableHead className="min-w-[280px]">Product Details</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="w-[110px]">Price (₹)</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[220px] text-center">
                      {isCentral ? "Central Stock Stepper" : `${currentCity?.cityName || "Branch"} Stock`}
                    </TableHead>
                    <TableHead className="w-[90px] text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingProducts ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <Spinner size="lg" className="inline-block mr-2" />
                        <span className="text-muted-foreground text-sm">
                          Loading {isCentral ? "central warehouse" : `${currentCity?.cityName || "branch"}`} inventory...
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No products found matching the selected filters in this location.
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
                            isStaged ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
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

                          {/* Name & Brand */}
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
                              </div>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell className="text-xs text-muted-foreground font-medium">
                            {p.productCategory || "Uncategorized"}
                          </TableCell>

                          {/* Price */}
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
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Low ({currentStock} left)
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
                                  title="Save this item"
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

                          {/* Actions */}
                          <TableCell className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit full product details">
                                <Link to="/kalkaji/products/$productId/edit" params={{ productId: p.productId }}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>

                              {p.seo?.slug && (
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="View on storefront">
                                  <Link to="/product/$" params={{ _splat: p.seo.slug }} target="_blank">
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
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
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-xs font-medium px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: Cross-City Inventory Matrix */}
      {viewMode === "MATRIX" && (
        <div className="space-y-4">
          <Card className="bg-slate-50/50 dark:bg-slate-900/30 border-dashed">
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-red-600" />
                  Cross-City Branch Comparison Matrix
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Holistic multi-city stock view across Central Master Depot and all registered operational city branches.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> In Stock (&gt;5)
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Low Stock (&le;5)
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Out of Stock (0)
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="min-w-[260px] pl-4">Battery Model & Specs</TableHead>
                    <TableHead className="min-w-[120px]">Category & Brand</TableHead>
                    <TableHead className="w-[140px] text-center font-bold text-red-700 bg-red-50/50 dark:bg-red-950/20">
                      Central Depot
                    </TableHead>
                    <TableHead className="min-w-[320px]">Operational Branches & Partners</TableHead>
                    <TableHead className="w-[130px] text-right pr-4">Quick Inspect</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {centralProductsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <Spinner size="lg" className="inline-block mr-2" />
                        <span className="text-muted-foreground text-sm">Loading multi-city matrix...</span>
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                        No products available for matrix view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.slice(0, 30).map((p) => {
                      const centralStock = p.productStock ?? 0;

                      return (
                        <TableRow key={p.productId} className="hover:bg-muted/40 transition-colors">
                          {/* Name */}
                          <TableCell className="pl-4">
                            <p className="font-semibold text-sm line-clamp-1">{p.productName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {(p.capacity || p.capacityAh) && (
                                <span className="text-[10px] text-blue-600 font-mono font-bold">
                                  {p.capacity || p.capacityAh}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                Master: ₹{p.productPrice?.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </TableCell>

                          {/* Category & Brand */}
                          <TableCell className="text-xs">
                            <span className="font-medium text-foreground">{p.brandName || "General"}</span>
                            <p className="text-[10px] text-muted-foreground">{p.productCategory || "Battery"}</p>
                          </TableCell>

                          {/* Central Depot Stock */}
                          <TableCell className="text-center font-mono font-bold bg-red-50/30 dark:bg-red-950/10">
                            {centralStock === 0 ? (
                              <Badge variant="outline" className="border-red-400 bg-red-50 text-red-700 text-[10px] font-bold">
                                0 (Depleted)
                              </Badge>
                            ) : centralStock <= LOW_STOCK_THRESHOLD ? (
                              <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-[10px] font-bold">
                                {centralStock} (Low)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                {centralStock} Ready
                              </Badge>
                            )}
                          </TableCell>

                          {/* Branches Pill List */}
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {cities.slice(0, 5).map((c) => {
                                const cityPartner = partners.find((pt) =>
                                  pt.operatingCities?.some((oc) => oc.cityId === c.cityId)
                                );

                                return (
                                  <Button
                                    key={c.cityId}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedLocation(c.cityId);
                                      setViewMode("LOCATION");
                                    }}
                                    className="h-6 text-[10px] px-2 gap-1 rounded-md bg-muted/30 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                                    title={`Click to manage ${c.cityName} inventory. Partner: ${
                                      cityPartner?.businessName || "Unassigned"
                                    }`}
                                  >
                                    <MapPin className="h-2.5 w-2.5 text-blue-500" />
                                    <span>{c.cityName}</span>
                                    {cityPartner && <span className="text-[9px] text-muted-foreground">• Partner</span>}
                                  </Button>
                                );
                              })}
                              {cities.length > 5 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{cities.length - 5} more branches
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Quick Inspect */}
                          <TableCell className="text-right pr-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocation("CENTRAL");
                                setViewMode("LOCATION");
                              }}
                              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <span>Manage</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar for Unsaved Changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-2xl bg-slate-900 text-white dark:bg-slate-800 rounded-xl shadow-2xl p-3 sm:p-4 border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs sm:text-sm font-semibold">
              {Object.keys(stagedStock).length} product{Object.keys(stagedStock).length > 1 ? "s" : ""} modified for{" "}
              <span className="text-amber-400 font-bold">
                {isCentral ? "Central Warehouse" : currentCity?.cityName || "branch"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscardAll}
              disabled={bulkUpdateMutation.isPending}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Discard
            </Button>

            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={bulkUpdateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 gap-1.5 shadow-md"
            >
              {bulkUpdateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
