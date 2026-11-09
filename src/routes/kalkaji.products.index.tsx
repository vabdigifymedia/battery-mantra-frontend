import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminProductListQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, CheckCircle, Clock, Search, Tag, X, Check, ArrowRight, Building2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { normalizeImageUrl } from "@/lib/image/cdn";
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

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Route = createFileRoute("/kalkaji/products/")({
  component: AdminProducts,
});

function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({
    ...adminProductListQuery(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeBrand, setActiveBrand] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const PAGE_SIZE = 15;

  const categoryFilteredProducts = activeCategory === "ALL"
    ? products
    : products?.filter(p => p.productCategory === activeCategory);

  const availableBrands = Array.from(new Set(categoryFilteredProducts?.map(p => p.brandName).filter(Boolean) as string[])).sort();

  const brandFilteredProducts = activeBrand === "ALL"
    ? categoryFilteredProducts
    : categoryFilteredProducts?.filter(p => p.brandName === activeBrand);

  const filteredProducts = searchQuery.trim() === ""
    ? brandFilteredProducts
    : brandFilteredProducts?.filter(p => 
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.capacity && p.capacity.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brandName && p.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const totalPages = Math.ceil((filteredProducts?.length || 0) / PAGE_SIZE);
  const paginatedProducts = filteredProducts?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product deleted successfully");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product approved and activated!");
    },
    onError: () => toast.error("Failed to approve product"),
  });

  const [catalogViewTab, setCatalogViewTab] = useState<"ALL_PRODUCTS" | "PENDING_PRODUCTS" | "PRICE_REQUESTS">("ALL_PRODUCTS");

  const { data: pendingPricingRequests = [], isLoading: isLoadingPricing } = useQuery({
    queryKey: ["admin", "pricing-requests", "pending"],
    queryFn: () => adminService.getPendingPricingRequests().catch(() => []),
    staleTime: 5000,
  });

  const pendingProductProposals = (products || []).filter((p) => p.isApproved === false);

  const approvePricingMutation = useMutation({
    mutationFn: (requestId: string) => adminService.approvePricingRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing-requests"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Partner city price approved and activated!");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to approve price change"),
  });

  const rejectPricingMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      adminService.rejectPricingRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing-requests"] });
      toast.success("Price change request rejected");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to reject price change"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Products & Partner Approvals</h2>
          <p className="text-muted-foreground">Manage your product catalog, review partner proposals and approve city pricing.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 h-9 w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button asChild size="sm" className="h-9">
            <Link to="/kalkaji/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Top View Selector: Catalog vs Partner Proposals vs Price Requests */}
      <div className="border-b pb-4">
        <Tabs value={catalogViewTab} onValueChange={(v: any) => setCatalogViewTab(v)} className="w-full">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="ALL_PRODUCTS" className="rounded-lg text-xs font-semibold py-2 px-4">
              All Products ({products?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="PENDING_PRODUCTS" className="rounded-lg text-xs font-semibold py-2 px-4 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Product Proposals
              {pendingProductProposals.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                  {pendingProductProposals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="PRICE_REQUESTS" className="rounded-lg text-xs font-semibold py-2 px-4 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              City Price Requests
              {pendingPricingRequests.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] px-1.5 py-0.2 font-bold">
                  {pendingPricingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── VIEW 1: PARTNER PRICE REQUESTS ───────────────────────────────── */}
      {catalogViewTab === "PRICE_REQUESTS" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-blue-500/5 border-blue-500/20 p-4">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" /> Partner City-Pricing Review
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Partners submit city pricing adjustments with market reasons. Approving applies the price live to their branch city.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Partner & City</TableHead>
                  <TableHead>Current vs Requested Price</TableHead>
                  <TableHead>Partner Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPricing ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Spinner size="md" className="inline-block" />
                    </TableCell>
                  </TableRow>
                ) : pendingPricingRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                        <p className="font-medium">No pending price change requests from partners.</p>
                        <p className="text-xs text-muted-foreground">When partners request price adjustments, they will appear here for review.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPricingRequests.map((req: any) => {
                    const diff = (req.price || 0) - (req.currentPrice || 0);
                    const diffPct = req.currentPrice ? ((diff / req.currentPrice) * 100).toFixed(1) : 0;
                    return (
                      <TableRow key={req.id || req.productId} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-semibold text-sm">{req.productName || "Product"}</div>
                          <div className="text-xs text-muted-foreground">ID: {req.productId?.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {req.partnerBusinessName || "Partner Store"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {req.cityName || "Operating City"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground line-through">₹{(req.currentPrice || 0).toLocaleString()}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold text-sm text-foreground">₹{(req.price || 0).toLocaleString()}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${diff >= 0 ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'}`}>
                              {diff >= 0 ? `+${diffPct}%` : `${diffPct}%`}
                            </span>
                          </div>
                          {req.exchangeDiscount != null && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Exch Disc: ₹{req.exchangeDiscount} · Stock: {req.stock ?? "N/A"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs italic text-muted-foreground max-w-[250px] whitespace-pre-wrap">
                            "{req.reason || "No reason given"}"
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                              disabled={approvePricingMutation.isPending}
                              onClick={() => approvePricingMutation.mutate(req.id || req.productId)}
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                              disabled={rejectPricingMutation.isPending}
                              onClick={() => {
                                const reason = prompt("Enter reason for rejection (optional):");
                                rejectPricingMutation.mutate({ requestId: req.id || req.productId, reason: reason || undefined });
                              }}
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── VIEW 2: PARTNER PRODUCT PROPOSALS ────────────────────────────── */}
      {catalogViewTab === "PENDING_PRODUCTS" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4">
            <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" /> New Product Proposals from Partners
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve new battery models proposed by partners before they go live on the storefront.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category & Brand</TableHead>
                  <TableHead>Proposed By</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProductProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                        <p className="font-medium">No pending product proposals.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingProductProposals.map((product) => (
                    <TableRow key={product.productId} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-semibold text-sm">{product.productName}</div>
                        {product.capacity && <div className="text-xs text-muted-foreground">Capacity: {product.capacity}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{product.productCategory || "Uncategorized"}</div>
                        <div className="text-xs text-muted-foreground">{product.brandName || "Generic"}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5">
                          {product.partnerBusinessName || "Partner"}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        ₹{product.productPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(product.productId)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve & Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(`Reject and delete proposal for ${product.productName}?`)) {
                                deleteMutation.mutate(product.productId);
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: ALL PRODUCTS (DEFAULT CATALOG) ────────────────────────── */}
      {catalogViewTab === "ALL_PRODUCTS" && (
        <>
          {products && products.length > 0 && (
            <Tabs value={activeCategory} onValueChange={(val) => { setActiveCategory(val); setActiveBrand("ALL"); setCurrentPage(1); }} className="w-full">
              <TabsList className="mb-4 flex-wrap justify-start h-auto gap-1 bg-muted/50 p-1">
                <TabsTrigger value="ALL" className="rounded-md">All Categories</TabsTrigger>
                {Array.from(new Set(products.map(p => p.productCategory).filter(Boolean) as string[])).sort().map(cat => (
                  <TabsTrigger key={cat} value={cat} className="rounded-md">{cat}</TabsTrigger>
                ))}
              </TabsList>
              
              {activeCategory !== "ALL" && availableBrands.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant={activeBrand === "ALL" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => { setActiveBrand("ALL"); setCurrentPage(1); }}
                    className="h-7 text-xs rounded-full px-4"
                  >
                    All Brands
                  </Button>
                  {availableBrands.map(brand => (
                    <Button 
                      key={brand}
                      variant={activeBrand === brand ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => { setActiveBrand(brand); setCurrentPage(1); }}
                      className="h-7 text-xs rounded-full px-4"
                    >
                      {brand}
                    </Button>
                  ))}
                </div>
              )}
            </Tabs>
          )}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>R/L</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading products...
                </TableCell>
              </TableRow>
            ) : !products?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts?.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    {product.productImage ? (
                      <img
                        src={normalizeImageUrl(product.productImage)}
                        alt={product.productName}
                        className="h-10 w-10 rounded-md object-contain border bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p>{product.productName}</p>
                      {product.isApproved === false && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5">
                          <Clock className="h-3 w-3" /> Pending Partner Request {product.partnerBusinessName ? `(${product.partnerBusinessName})` : ""}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.productCategory || "N/A"}</TableCell>
                  <TableCell>{product.brandName || "N/A"}</TableCell>
                  <TableCell>
                    {product.capacity ? (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {product.capacity}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>₹{product.productPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {product.isApproved === false && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveMutation.mutate(product.productId)}
                        disabled={approveMutation.isPending}
                        className="mr-2 text-xs text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 gap-1 font-semibold"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Approve
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="icon">
                      <Link to="/kalkaji/products/$productId/edit" params={{ productId: product.productId }}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the product "{product.productName}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(product.productId)}
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="sm" className="mr-2" /> Loading...
          </div>
        ) : !products?.length ? (
          <div className="text-center py-12 text-muted-foreground">No products found.</div>
        ) : (
          paginatedProducts?.map((product) => (
            <div key={product.productId} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex gap-3">
                {product.productImage ? (
                  <img
                    src={normalizeImageUrl(product.productImage)}
                    alt={product.productName}
                    className="h-14 w-14 rounded-lg object-contain border bg-white shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">N/A</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{product.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.brandName || "N/A"} · {product.productCategory || "N/A"}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-primary">₹{product.productPrice.toLocaleString()}</span>
                    {product.capacity && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {product.capacity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link to="/kalkaji/products/$productId/edit" params={{ productId: product.productId }}>
                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the product "{product.productName}".
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(product.productId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
            <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredProducts?.length || 0)}</span> of{" "}
            <span className="font-medium">{filteredProducts?.length}</span> results
          </p>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                />
              </PaginationItem>
              <PaginationItem className="hidden sm:inline-flex px-4 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
        </>
      )}
    </div>
  );
}
