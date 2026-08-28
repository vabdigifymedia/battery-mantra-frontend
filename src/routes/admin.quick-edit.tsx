import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminService } from "@/services/admin.service";
import { categoriesService, brandsService } from "@/services/catalog.service";
import { productsService } from "@/services/products.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Save, AlertCircle, RotateCcw } from "lucide-react";
import type { BulkProductUpdateRequest, ProductListResponse } from "@/types/dto";

export const Route = createFileRoute("/admin/quick-edit")({
  component: BulkPricingPage,
});

function BulkPricingPage() {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [brandId, setBrandId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editedProducts, setEditedProducts] = useState<Record<string, BulkProductUpdateRequest>>({});

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.list(),
  });

  // Fetch Brands
  const { data: brands } = useQuery({
    queryKey: ["brands", categoryId],
    queryFn: () => brandsService.list(undefined, categoryId !== "all" ? categoryId : undefined),
  });

  // Fetch Products based on filters
  const { data: productsData, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "products", "filter", categoryId, brandId, search],
    queryFn: () => productsService.filter({
      categoryId: categoryId !== "all" ? [categoryId] : undefined,
      brandId: brandId !== "all" ? [brandId] : undefined,
      keyword: search || undefined,
      size: 500, // Fetch up to 500 for bulk editing easily
    }),
  });

  const products = productsData?.content || [];

  const handleEdit = (productId: string, field: keyof BulkProductUpdateRequest, value: any) => {
    setEditedProducts((prev) => {
      const existing = prev[productId] || { productId };
      return {
        ...prev,
        [productId]: { ...existing, [field]: value },
      };
    });
  };

  const getFieldValue = (product: ProductListResponse, field: keyof ProductListResponse & keyof BulkProductUpdateRequest) => {
    if (editedProducts[product.productId] && editedProducts[product.productId][field] !== undefined) {
      return editedProducts[product.productId][field];
    }
    return product[field] || "";
  };

  const hasUnsavedChanges = Object.keys(editedProducts).length > 0;

  const saveMutation = useMutation({
    mutationFn: (updates: BulkProductUpdateRequest[]) => adminService.bulkUpdateProducts(updates),
    onSuccess: () => {
      toast.success("Prices and Highlights updated successfully!");
      setEditedProducts({});
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: () => {
      toast.error("Failed to update products.");
    },
  });

  const handleSave = () => {
    const updates = Object.values(editedProducts).filter(update => 
      update.productPrice !== undefined || 
      update.originalPrice !== undefined || 
      update.exchangeDiscount !== undefined ||
      update.highlights !== undefined
    );
    if (updates.length > 0) {
      saveMutation.mutate(updates);
    }
  };

  return (
    <div className="space-y-6 pb-24 relative min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quick Edit (Prices & Highlights)</h1>
          <p className="text-muted-foreground mt-2">Quickly edit MRP, Selling Price, Exchange Value, and Product Badges/Highlights.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-xl border">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category</label>
          <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setBrandId("all"); setEditedProducts({}); }}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Brand</label>
          <Select value={brandId} onValueChange={(val) => { setBrandId(val); setEditedProducts({}); }}>
            <SelectTrigger>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands?.map((b) => (
                <SelectItem key={b.brandId} value={b.brandId}>{b.brandName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Search</label>
          <Input 
            placeholder="Search by name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="border rounded-xl bg-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold min-w-[250px]">Product Info</th>
              <th className="px-4 py-3 font-semibold w-[130px]">MRP (₹)</th>
              <th className="px-4 py-3 font-semibold w-[130px]">Base Price (₹)<br/><span className="text-[10px] normal-case font-normal text-muted-foreground">(Without Exch.)</span></th>
              <th className="px-4 py-3 font-semibold w-[130px]">Old Battery (₹)<br/><span className="text-[10px] normal-case font-normal text-muted-foreground">(Exchange Value)</span></th>
              <th className="px-4 py-3 font-semibold min-w-[200px]">Highlights<br/><span className="text-[10px] normal-case font-normal text-muted-foreground">(Comma separated tags)</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={6} className="h-32 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-32 text-center text-muted-foreground">
                  No products found for the selected filters.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isEdited = !!editedProducts[p.productId];

                return (
                  <tr key={p.productId} className={`hover:bg-muted/30 transition-colors ${isEdited ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.productImage ? (
                          <img src={p.productImage} alt={p.productName} className="w-10 h-10 object-contain rounded bg-white border shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted border shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-2 leading-tight" title={p.productName}>{p.productName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{p.brandName} • {p.productCategory}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" 
                        className={`h-9 ${editedProducts[p.productId]?.originalPrice !== undefined ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                        value={getFieldValue(p, "originalPrice")}
                        onChange={(e) => handleEdit(p.productId, "originalPrice", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" 
                        className={`h-9 ${editedProducts[p.productId]?.productPrice !== undefined ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                        value={getFieldValue(p, "productPrice")}
                        onChange={(e) => handleEdit(p.productId, "productPrice", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" 
                        className={`h-9 ${editedProducts[p.productId]?.exchangeDiscount !== undefined ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                        value={getFieldValue(p, "exchangeDiscount")}
                        onChange={(e) => handleEdit(p.productId, "exchangeDiscount", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="text" 
                        placeholder="e.g. Best Seller, Top Rated"
                        className={`h-9 ${editedProducts[p.productId]?.highlights !== undefined ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                        value={getFieldValue(p, "highlights")}
                        onChange={(e) => handleEdit(p.productId, "highlights", e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Action Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-50 p-4 animate-in slide-in-from-bottom-6">
          <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-4 px-6 flex items-center justify-between border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-full">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Unsaved Changes</p>
                <p className="text-sm text-slate-300">You have modified {Object.keys(editedProducts).length} product(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setEditedProducts({})}
                disabled={saveMutation.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Discard
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
              >
                {saveMutation.isPending ? <Spinner className="mr-2" size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
