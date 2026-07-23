import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productListQuery, categoriesQuery, brandsQuery } from "@/queries";
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
import { Plus, Tag, Search, Clock, CheckCircle, Package, MapPin } from "lucide-react";
import type { ProductListResponse, CityPricingDto } from "@/types/dto";

export const Route = createFileRoute("/partner/products")({
  component: PartnerProductsPage,
});

function PartnerProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<ProductListResponse | null>(null);
  const [isRequestProductOpen, setIsRequestProductOpen] = useState(false);

  // Queries
  const { data: products = [], isLoading } = useQuery(productListQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: brands = [] } = useQuery(brandsQuery());

  // City Pricing Form State
  const [cityPrice, setCityPrice] = useState("");
  const [exchangeDiscount, setExchangeDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  // New Product Request Form State
  const [newProductName, setNewProductName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newBrandId, setNewBrandId] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");
  const [newExchangeDiscount, setNewExchangeDiscount] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Get partner profile to fetch operating cities
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: ({ signal }) => partnerDashboardService.getMyProfile(signal),
  });

  const operatingCities = partnerProfile?.operatingCities || [];

  // Mutations
  const updateCityPricingMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: CityPricingDto }) =>
      partnerDashboardService.updateCityPricing(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("City price updated successfully!");
      setSelectedProductForPricing(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update city pricing. Ensure city is in your branch operating cities.");
    },
  });

  const requestProductMutation = useMutation({
    mutationFn: (data: any) => partnerDashboardService.requestNewProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product proposal submitted! Waiting for Admin approval.");
      setIsRequestProductOpen(false);
      resetRequestForm();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to submit product request."),
  });

  const resetRequestForm = () => {
    setNewProductName("");
    setNewCategoryId("");
    setNewBrandId("");
    setNewBasePrice("");
    setNewExchangeDiscount("");
    setNewCapacity("");
    setNewImageUrl("");
    setNewDescription("");
  };

  const handleOpenPricingModal = (product: ProductListResponse) => {
    setSelectedProductForPricing(product);
    setCityPrice(product.productPrice.toString());
    setExchangeDiscount((product.exchangeDiscount || 0).toString());
    setStock("10");
    if (operatingCities.length > 0) {
      setSelectedCityId(operatingCities[0].cityId);
    } else {
      setSelectedCityId("");
    }
  };

  const handleSaveCityPricing = () => {
    if (!selectedProductForPricing || !cityPrice) {
      toast.error("Please enter a valid price");
      return;
    }

    const targetCityId = selectedCityId || (operatingCities.length > 0 ? operatingCities[0].cityId : undefined);

    updateCityPricingMutation.mutate({
      productId: selectedProductForPricing.productId,
      data: {
        cityId: targetCityId,
        price: parseFloat(cityPrice),
        exchangeDiscount: exchangeDiscount ? parseFloat(exchangeDiscount) : 0,
        stock: stock ? parseInt(stock, 10) : 0,
      },
    });
  };

  const handleCreateProductRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newCategoryId || !newBasePrice || !newImageUrl) {
      toast.error("Please fill in all required fields.");
      return;
    }

    requestProductMutation.mutate({
      productName: newProductName,
      categoryId: newCategoryId,
      brandId: newBrandId || undefined,
      productPrice: parseFloat(newBasePrice),
      exchangeDiscount: newExchangeDiscount ? parseFloat(newExchangeDiscount) : 0,
      capacity: newCapacity || undefined,
      productImage: newImageUrl,
      productDescription: newDescription || undefined,
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      (p.brandName && p.brandName.toLowerCase().includes(search.toLowerCase())) ||
      (p.productCategory && p.productCategory.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & City Pricing</h1>
          <p className="text-muted-foreground">
            Manage custom battery prices for your operating city or request new products for Admin approval.
          </p>
        </div>
        <Button onClick={() => setIsRequestProductOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Request New Product
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, category, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Category & Brand</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Approval Status</TableHead>
              <TableHead className="text-right">City Price Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Spinner size="md" className="inline-block" />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.productId} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.productImage ? (
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className="h-10 w-10 rounded object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted border flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{product.productName}</p>
                        {product.capacity && (
                          <p className="text-xs text-muted-foreground">Cap: {product.capacity}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="font-medium">{product.productCategory || "Uncategorized"}</p>
                    <p className="text-xs text-muted-foreground">{product.brandName || "Generic"}</p>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground">
                    ₹{product.productPrice.toLocaleString()}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPricingModal(product)}
                      className="gap-1.5 text-xs"
                    >
                      <Tag className="h-3.5 w-3.5" /> Change City Price
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
                Customize product price and exchange discount for your operating city branch.
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProductForPricing(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCityPricing} disabled={updateCityPricingMutation.isPending}>
                {updateCityPricingMutation.isPending ? "Saving..." : "Save City Pricing"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Request New Product Modal */}
      {isRequestProductOpen && (
        <Dialog open={isRequestProductOpen} onOpenChange={setIsRequestProductOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Request New Product
              </DialogTitle>
              <DialogDescription>
                Propose a new battery product to the platform. It will be sent to Admin for approval.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProductRequest} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Product Name *</Label>
                <Input
                  required
                  placeholder="e.g. Amaron Hi-Way Commercial Battery 150Ah"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Category *</Label>
                  <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Brand</Label>
                  <Select value={newBrandId} onValueChange={setNewBrandId}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.brandId} value={b.brandId}>
                          {b.brandName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Base Price (₹) *</Label>
                  <Input
                    required
                    type="number"
                    placeholder="Price"
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Exchange Disc. (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Discount"
                    value={newExchangeDiscount}
                    onChange={(e) => setNewExchangeDiscount(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Capacity (Ah)</Label>
                  <Input
                    placeholder="e.g. 150Ah"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Product Image URL *</Label>
                <Input
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  placeholder="Enter details about battery specifications, warranty, etc."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" type="button" onClick={() => setIsRequestProductOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={requestProductMutation.isPending}>
                  {requestProductMutation.isPending ? "Submitting..." : "Submit Proposal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
