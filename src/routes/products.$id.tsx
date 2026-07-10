import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { CheckCircle2, ShoppingCart, Zap, ShieldCheck, Truck, RefreshCw, Battery } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/products/ProductGallery";
import { SpecificationsTable, flattenSpecs } from "@/components/products/SpecificationsTable";
import { ProductCard } from "@/components/products/ProductCard";
import { Price } from "@/components/common/Price";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ApiError } from "@/lib/api/errors";
import { productDetailQuery, productListQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/providers/AuthProvider";
import { cartService } from "@/services/cart.service";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const searchSchema = z.object({
  autoAdd: z.enum(["true", "false"]).optional().catch(undefined),
  autoBuy: z.enum(["true", "false"]).optional().catch(undefined),
});

export const Route = createFileRoute("/products/$id")({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(productDetailQuery(params.id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  head: () => ({
    meta: [{ title: "Product · BatteryMantra" }, { name: "robots", content: "index,follow" }],
  }),
  component: PdpPage,
  errorComponent: ({ error, reset }) => (
    <Container size="lg" className="py-12">
      <ErrorState
        title="Couldn't load this product"
        description={error.message}
        onRetry={reset}
      />
    </Container>
  ),
  notFoundComponent: () => (
    <Container size="lg" className="py-12">
      <EmptyState
        title="Product not found"
        description="The product you're looking for doesn't exist or was removed."
        action={
          <Button asChild variant="brand">
            <Link to="/products">Back to shop</Link>
          </Button>
        }
      />
    </Container>
  ),
});

function PdpPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(productDetailQuery(id));
  const { status } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [exchange, setExchange] = useState<"no" | "yes">("no");

  const inStock = (data.productStock ?? 0) > 0;
  const isExchange = exchange === "yes";

  const addToCart = useMutation({
    mutationFn: () => cartService.add({ productId: data.productId, quantity: qty, exchangeOldBattery: isExchange }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      toast.success(`Added ${qty} × ${data.productName} to cart`);
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Could not add to cart.");
    },
  });

  const search = Route.useSearch();
  
  useEffect(() => {
    if (status === "authenticated" && search.autoAdd === "true" && inStock && !addToCart.isPending && !addToCart.isSuccess) {
      navigate({ search: (prev) => ({ ...prev, autoAdd: undefined }), replace: true });
      addToCart.mutate();
    } else if (status === "authenticated" && search.autoBuy === "true" && inStock && !addToCart.isPending && !addToCart.isSuccess) {
      navigate({ search: (prev) => ({ ...prev, autoBuy: undefined }), replace: true });
      addToCart.mutate(undefined, {
        onSuccess: () => navigate({ to: "/checkout" }),
      });
    }
  }, [status, search.autoAdd, search.autoBuy, inStock]);

  const onAdd = () => {
    if (status !== "authenticated") {
      toast.info("Please sign in to add items to your cart.");
      navigate({ to: "/login", search: { redirect: `/products/${id}?autoAdd=true` } });
      return;
    }
    addToCart.mutate();
  };

  const onBuyNow = () => {
    if (status !== "authenticated") {
      navigate({ to: "/login", search: { redirect: `/products/${id}?autoBuy=true` } });
      return;
    }
    addToCart.mutate(undefined, {
      onSuccess: () => navigate({ to: "/checkout" }),
    });
  };

  const allFlatSpecs = flattenSpecs(data.specs);
  const topSpecs = allFlatSpecs.slice(0, 4);

  const originalPrice = data.specs?.originalPrice ? Number(data.specs.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > data.productPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - data.productPrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="bg-muted/30 min-h-screen pb-16">
      {/* Breadcrumb Header */}
      <div className="bg-background border-b mb-6">
        <Container size="xl" className="py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/products">Shop</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {data.categoryName && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">{data.categoryName}</span>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[40ch] font-medium">
                  {data.productName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Container>
      </div>

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Gallery */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <div className="p-4 bg-white flex justify-center items-center aspect-square">
                {data.productImage ? (
                  <img 
                    src={data.productImage} 
                    alt={data.productName} 
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 cursor-crosshair mix-blend-multiply" 
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <Battery className="h-16 w-16 mb-2 opacity-20" />
                    <span>No image available</span>
                  </div>
                )}
              </div>
            </Card>
            <div className="flex gap-4 justify-center py-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-green-600" /> Genuine Product</div>
              <div className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-blue-600" /> Easy Replacement</div>
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Buy Box */}
          <div className="lg:col-span-7 space-y-8">
            {/* Title & Core Details */}
            <div className="space-y-4">
              <div>
                {data.brandName && (
                  <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-1">
                    {data.brandName}
                  </p>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {data.productName}
                </h1>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Price value={data.productPrice} size="xl" className="text-4xl tracking-tight" />
                {hasDiscount && (
                  <>
                    <span className="text-2xl text-muted-foreground line-through decoration-muted-foreground/50 font-medium">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-sm px-2.5 py-0.5 rounded-md font-semibold">
                      {discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>
              
              <div>
                {inStock ? (
                  <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-sm py-1">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> In Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-sm py-1">
                    Out of stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Key Highlights */}
            {topSpecs.length > 0 && (
              <div className="bg-background rounded-xl p-5 border shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Key Highlights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  {topSpecs.map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-muted-foreground min-w-[100px]">{key}</span>
                      <span className="font-medium text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Buy Box */}
            <div className="space-y-6">
              
              {/* Exchange Widget (Flipkart Style) */}
              {(data.exchangeDiscount ?? 0) > 0 && (
                <div className="space-y-3">
                <h3 className="font-semibold text-lg">Exchange Offer</h3>
                <RadioGroup value={exchange} onValueChange={(val: "yes" | "no") => setExchange(val)} className="grid gap-4 sm:grid-cols-2">
                  <Label
                    htmlFor="exchange-no"
                    className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 hover:bg-muted/50 transition-colors ${
                      exchange === "no" ? "border-brand bg-brand/5" : "border-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="exchange-no" />
                        <span className="font-medium text-base">Buy New</span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold ml-6">
                      ₹{data.productPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-6 mt-1">Keep your old battery</span>
                  </Label>

                  <Label
                    htmlFor="exchange-yes"
                    className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 hover:bg-muted/50 transition-colors ${
                      exchange === "yes" ? "border-success bg-success/5" : "border-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="exchange-yes" className="text-success border-success data-[state=checked]:border-success data-[state=checked]:text-success" />
                        <span className="font-medium text-base">With Exchange</span>
                      </div>
                      <Badge className="bg-success text-success-foreground hover:bg-success">Save ₹{data.exchangeDiscount?.toLocaleString()}</Badge>
                    </div>
                    <span className="text-2xl font-bold text-success ml-6">
                      ₹{Math.max(0, data.productPrice - (data.exchangeDiscount || 0)).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-6 mt-1">Return old battery</span>
                  </Label>
                </RadioGroup>
              </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start border rounded-lg bg-background px-4 py-2 h-14">
                  <span className="text-sm text-muted-foreground mr-4">Qty</span>
                  <QuantityStepper
                    value={qty}
                    onChange={setQty}
                    min={1}
                    max={Math.max(1, data.productStock ?? 10)}
                    disabled={!inStock}
                  />
                </div>
                
                <div className="flex-1 flex w-full gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-14 text-base font-semibold border-2 hover:bg-brand/5"
                    onClick={onAdd}
                    disabled={!inStock || addToCart.isPending}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="brand"
                    size="lg"
                    className="flex-1 h-14 text-base font-semibold shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all"
                    onClick={onBuyNow}
                    disabled={!inStock || addToCart.isPending}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* TABS SECTION */}
      <Container size="xl" className="mt-12">
        <Tabs defaultValue="specs" className="w-full bg-background rounded-xl border shadow-sm p-2 sm:p-6">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
            <TabsTrigger value="specs" className="text-sm sm:text-base data-[state=active]:shadow-sm">Specifications</TabsTrigger>
            <TabsTrigger value="desc" className="text-sm sm:text-base data-[state=active]:shadow-sm">Description</TabsTrigger>
            <TabsTrigger value="vehicles" className="text-sm sm:text-base data-[state=active]:shadow-sm">Compatible Vehicles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="specs" className="p-2 sm:p-4 outline-none">
            {data.specs && Object.keys(data.specs).length > 0 ? (
              <SpecificationsTable specs={data.specs} />
            ) : (
              <EmptyState title="No Specifications" description="Detailed specifications are not available for this product yet." />
            )}
          </TabsContent>
          
          <TabsContent value="desc" className="p-2 sm:p-4 outline-none">
            {data.productDescription ? (
              <div 
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: data.productDescription }}
              />
            ) : (
              <EmptyState title="No Description" description="Description is not available for this product yet." />
            )}
          </TabsContent>
          
          <TabsContent value="vehicles" className="p-2 sm:p-4 outline-none">
            {data.compatibleVehicles && data.compatibleVehicles.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.compatibleVehicles.map((v) => (
                  <li key={v.vehicleId} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                    {v.imageUrl ? (
                      <div className="h-10 w-10 shrink-0 rounded bg-white p-1">
                        <img src={v.imageUrl} alt={v.model} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <Truck className="h-8 w-8 text-muted-foreground/50 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground">
                        {v.make} {v.model}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {[v.fuelType, v.yearFrom && v.yearTo ? `${v.yearFrom}–${v.yearTo}` : v.yearFrom || v.yearTo].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No Compatibility Data" description="Vehicle compatibility is not available for this product yet." />
            )}
          </TabsContent>
        </Tabs>
      </Container>
      
      <RelatedProducts currentProductId={id} />
    </div>
  );
}

function RelatedProducts({ currentProductId }: { currentProductId: string }) {
  const { data: allProducts } = useQuery(productListQuery());
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const filtered = allProducts.filter((p: any) => p.productId !== currentProductId);
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      setRelated(shuffled.slice(0, 4));
    }
  }, [allProducts, currentProductId]);

  if (!related.length) return null;

  return (
    <Container size="xl" className="mt-16 border-t pt-12">
      <h2 className="text-2xl font-bold mb-8">More Products You Might Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {related.map(p => (
          <ProductCard key={p.productId} product={p} />
        ))}
      </div>
    </Container>
  );
}
