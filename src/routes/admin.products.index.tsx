import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productListQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, CheckCircle, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/admin/products/")({
  component: AdminProducts,
});

function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery(productListQuery());
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
      toast.success("Product deleted successfully");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product approved and activated!");
    },
    onError: () => toast.error("Failed to approve product"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog.</p>
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
            <Link to="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

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
                      <img src={product.productImage} alt={product.productName} className="h-10 w-10 rounded-md object-cover border" />
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
                      <Link to="/admin/products/$productId/edit" params={{ productId: product.productId }}>
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
                  <img src={product.productImage} alt={product.productName} className="h-14 w-14 rounded-lg object-cover border shrink-0" />
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
                  <Link to="/admin/products/$productId/edit" params={{ productId: product.productId }}>
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
    </div>
  );
}
