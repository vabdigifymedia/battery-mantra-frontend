import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { 
  Clock, Check, RefreshCcw, Tag, Truck, CheckCircle2, FileText, 
  Share2, MapPin, Search, Plus, Minus, Battery, ShieldAlert, 
  ShoppingCart, ArrowLeft, Heart, Info, AlertCircle, Zap, PhoneCall,
  ShieldCheck, RefreshCw, Settings, PiggyBank, Star, Cpu, Wrench, 
  Maximize, Scale, Activity, Layers, Plug, X
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/products/ProductGallery";
import { SpecificationsTable, flattenSpecs } from "@/components/products/SpecificationsTable";
import { ProductCard } from "@/components/products/ProductCard";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ApiError } from "@/lib/api/errors";
import { productDetailQuery, productListQuery, vehiclesListQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/providers/AuthProvider";
import { cartService } from "@/services/cart.service";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useLocationStore } from "@/store/useLocationStore";

import { deliveryTimeService } from "@/services/delivery-time.service";

const searchSchema = z.object({
  autoAdd: z.enum(["true", "false"]).optional().catch(undefined),
  autoBuy: z.enum(["true", "false"]).optional().catch(undefined),
});

export const Route = createFileRoute("/products/$id")({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(productDetailQuery(params.id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.productName} · BatteryMantra` : "Product · BatteryMantra" },
      { name: "description", content: loaderData ? `Buy ${loaderData.productName} at best price on BatteryMantra.` : "Buy batteries at best price." },
      { name: "robots", content: "index,follow" }
    ],
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
  const hasExchangeOffer = (data.exchangeDiscount ?? 0) > 0;
  const [exchange, setExchange] = useState<"no" | "yes">(hasExchangeOffer ? "yes" : "no");
  
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  const { isServiceable, pincode, city } = useLocationStore();
  const locationChecked = Boolean(pincode || city);
  const blockPurchase = locationChecked && !isServiceable;

  const vehicles = useQuery(vehiclesListQuery());
  const displayVehicles = data.capacity 
    ? (vehicles.data || []).filter(v => v.capacityId === data.capacity)
    : [];

  const { data: deliveryTime, isLoading: isLoadingDeliveryTime } = useQuery({
    queryKey: ["delivery-time", data.categoryId, city?.cityId],
    queryFn: () => deliveryTimeService.getDeliveryTime(data.categoryId, city!.cityId),
    enabled: !!data.categoryId && !!city?.cityId,
  });

  const inStock = (data.productStock ?? 0) > 0;

  useEffect(() => {
    if (data?.productImage && !activeImage) {
      setActiveImage(data.productImage);
    }
  }, [data?.productImage, activeImage]);

  const galleryImages = [data?.productImage, ...(data?.additionalImages || [])].filter(Boolean) as string[];


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
    if (blockPurchase) return;
    if (status !== "authenticated") {
      toast.info("Please sign in to add items to your cart.");
      navigate({ to: "/login", search: { redirect: `/products/${id}?autoAdd=true` } });
      return;
    }
    addToCart.mutate();
  };

  const onBuyNow = () => {
    if (blockPurchase) return;
    if (status !== "authenticated") {
      navigate({ to: "/login", search: { redirect: `/products/${id}?autoBuy=true` } });
      return;
    }
    addToCart.mutate(undefined, {
      onSuccess: () => navigate({ to: "/checkout" }),
    });
  };

  const allFlatSpecs = flattenSpecs(data.specs);
  
  const getPriorityScore = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("warranty")) return 1;
    if (k.includes("capacity")) return 2;
    if (k.includes("battery type") || k.includes("product type") || k === "type") return 3;
    return 99;
  };

  const topSpecs = [...allFlatSpecs]
    .sort((a, b) => getPriorityScore(a[0]) - getPriorityScore(b[0]))
    .slice(0, 6);

  const getSpecIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("not covered") || k.includes("exclusion")) return <ShieldAlert className="h-6 w-6 text-white" />;
    if (k.includes("warranty") || k.includes("life") || k.includes("guarantee")) return <ShieldCheck className="h-6 w-6 text-white" />;
    if (k.includes("capacity") || k.includes("ah") || k.includes("battery")) return <Battery className="h-6 w-6 text-white" />;
    if (k.includes("type") || k.includes("chemistry")) return <Zap className="h-6 w-6 text-white" />;
    if (k.includes("maintenance")) return <Wrench className="h-6 w-6 text-white" />;
    if (k.includes("cost") || k.includes("price") || k.includes("saving")) return <PiggyBank className="h-6 w-6 text-white" />;
    if (k.includes("bms") || k.includes("compact") || k.includes("size")) return <Cpu className="h-6 w-6 text-white" />;
    if (k.includes("dimension") || k.includes("length") || k.includes("width") || k.includes("height")) return <Maximize className="h-6 w-6 text-white" />;
    if (k.includes("weight") || k.includes("kg")) return <Scale className="h-6 w-6 text-white" />;
    if (k.includes("volt")) return <Activity className="h-6 w-6 text-white" />;
    if (k.includes("layout") || k.includes("terminal") || k.includes("polarity")) return <Plug className="h-6 w-6 text-white" />;
    if (k.includes("material") || k.includes("alloy") || k.includes("grid")) return <Layers className="h-6 w-6 text-white" />;
    return <CheckCircle2 className="h-6 w-6 text-white" />;
  };

  const originalPrice = data.specs?.originalPrice ? Number(data.specs.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > data.productPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - data.productPrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="bg-muted/30 min-h-screen pb-24 sm:pb-16 pt-14 sm:pt-0">
      {/* Mobile Navbar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b h-14 flex items-center justify-between px-3 shadow-sm">
        <button onClick={() => window.history.back()} className="p-2 -ml-1 rounded-full hover:bg-muted text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-muted text-foreground">
            <Search className="h-5 w-5" />
          </button>
          <Link to="/checkout" className="p-2 rounded-full hover:bg-muted text-foreground relative">
             <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Breadcrumb Header */}
      <div className="bg-background border-b mb-6 hidden sm:block">
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
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="flex flex-col-reverse lg:flex-row gap-4 items-start">
              
              {/* THUMBNAILS: horizontal on mobile (below image), vertical on desktop (left of image) */}
              {galleryImages.length > 1 && (
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 w-full lg:w-24 shrink-0 scrollbar-hide lg:max-h-[500px] scroll-smooth">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border-2 rounded-xl overflow-hidden bg-white/60 backdrop-blur-sm transition-all duration-300 ${
                        activeImage === img 
                          ? "border-brand shadow-md shadow-brand/20 scale-105 bg-white" 
                          : "border-transparent hover:border-brand/40 hover:scale-105 hover:bg-white"
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}

              {/* MAIN IMAGE */}
              <Card className="flex-1 overflow-hidden border-border/40 shadow-sm rounded-2xl w-full relative bg-gradient-to-br from-white to-muted/20 transition-all hover:shadow-md">
                <div className="p-6 flex justify-center items-center aspect-[4/3] lg:aspect-square relative">
                  {activeImage ? (
                    <button 
                      onClick={() => {
                        const idx = galleryImages.indexOf(activeImage);
                        setInitialSlide(Math.max(0, idx));
                        setIsFullscreenGallery(true);
                      }} 
                      className="w-full h-full cursor-zoom-in outline-none relative group"
                    >
                      <img 
                        src={activeImage} 
                        alt={data.productName} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply drop-shadow-xl" 
                      />
                      <div className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                      <Battery className="h-16 w-16 mb-2 opacity-20" />
                      <span>No image available</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            
            <div className="flex gap-6 justify-center mt-6 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-5 w-5 text-green-600" /> Genuine Product</div>
              <div className="flex items-center gap-1.5"><RefreshCw className="h-5 w-5 text-blue-600" /> Easy Replacement</div>
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
                <Price 
                  value={exchange === "yes" && hasExchangeOffer ? Math.max(0, data.productPrice - (data.exchangeDiscount || 0)) : data.productPrice} 
                  size="xl" 
                  className="text-4xl tracking-tight" 
                />
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
              
              {/* Delivery Time Widget */}
              {city ? (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
                  <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Delivery to <span className="text-primary font-semibold">{city.cityName}</span></p>
                    {isLoadingDeliveryTime ? (
                      <div className="h-4 w-32 bg-muted rounded animate-pulse mt-1"></div>
                    ) : (deliveryTime?.days || deliveryTime?.hours) ? (
                      <p className="text-muted-foreground">
                        Estimated time: <span className="font-medium text-foreground">{deliveryTime.days ? `${deliveryTime.days} Days` : ''} {deliveryTime.hours ? `${deliveryTime.hours} Hours` : ''}</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Standard delivery time applies.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
                  <div className="bg-muted p-2 rounded-full text-muted-foreground shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <p className="text-muted-foreground">Please select a location above to see estimated delivery time.</p>
                </div>
              )}
            </div>

            {/* Key Highlights */}
            {topSpecs.length > 0 && (
              <div className="pt-2 pb-4">
                <h3 className="font-bold text-2xl mb-8 text-foreground">Key Features</h3>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-y-6 sm:gap-y-10 gap-x-2 sm:gap-x-4">
                  {topSpecs.map(([key, value], idx) => {
                    return (
                      <div key={key} className="flex items-center gap-2 sm:gap-4 relative">
                        <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-primary shadow-md">
                           <div className="scale-[0.65] sm:scale-100 flex items-center justify-center">
                             {getSpecIcon(key)}
                           </div>
                        </div>
                        <div className="flex flex-col pr-1 sm:pr-4">
                           <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0 sm:mb-0.5">{key}</span>
                           <span className="font-bold text-xs sm:text-lg text-foreground leading-tight">{String(value)}</span>
                        </div>
                        {/* Divider for desktop */}
                        {(idx + 1) % 3 !== 0 && idx !== topSpecs.length - 1 && (
                          <div className="hidden xl:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-border -mr-2" />
                        )}
                        {/* Divider for tablet and mobile */}
                        {(idx + 1) % 2 !== 0 && idx !== topSpecs.length - 1 && (
                          <div className="block xl:hidden absolute right-0 top-1/2 -translate-y-1/2 h-8 sm:h-10 w-px bg-border -mr-1 sm:-mr-2" />
                        )}
                      </div>
                    )
                  })}
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
              <div className="fixed bottom-0 left-0 right-0 z-[100] sm:static flex flex-row items-center gap-2 sm:gap-4 p-3 sm:p-0 pt-4 bg-background sm:bg-transparent border-t sm:border-none shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sm:shadow-none">
                <div className="hidden sm:flex items-center justify-between sm:justify-start border rounded-lg bg-background px-4 py-2 h-14">
                  <span className="text-sm text-muted-foreground mr-4">Qty</span>
                  <QuantityStepper
                    value={qty}
                    onChange={setQty}
                    min={1}
                    max={Math.max(1, data.productStock ?? 10)}
                    disabled={!inStock || blockPurchase}
                  />
                </div>
                
                <div className="flex-1 flex w-full gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold border-2 hover:bg-brand/5 px-2"
                    onClick={onAdd}
                    disabled={!inStock || addToCart.isPending || blockPurchase}
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="brand"
                    size="lg"
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all px-2"
                    onClick={onBuyNow}
                    disabled={!inStock || addToCart.isPending || blockPurchase}
                  >
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>

              {blockPurchase && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Delivery Not Available</h4>
                    <p className="text-xs mt-1 opacity-90">
                      Sorry, we currently do not deliver to {pincode || city?.cityName}. Please change your location to purchase.
                    </p>
                  </div>
                </div>
              )}

              {/* Need Help in Buying Block (Premium Redesign) */}
              <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-background to-muted border border-border shadow-md transition-all hover:shadow-lg">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-0"></div>
                
                <div className="p-5 sm:p-6 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 gap-4">
                    <div className="flex gap-4 items-center sm:items-start">
                      <div className="relative shrink-0">
                        <div className="bg-gradient-to-tr from-primary to-primary/60 p-[2px] rounded-full shadow-md">
                          <div className="bg-background rounded-full h-14 w-14 sm:h-16 sm:w-16 overflow-hidden border-2 border-background">
                            {/* Replaced generic avatar with a professional premium look avatar */}
                            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Vikas&backgroundColor=e2e8f0" alt="Vikas" className="h-full w-full object-cover" />
                          </div>
                        </div>
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full shadow-sm">
                          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">Need expert advice?</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">Talk directly to Vikas</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 w-fit px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          Mon - Sat (9:30 AM - 5:30 PM)
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a href="https://wa.me/919667123456?text=Hi,%20I%20need%20help%20buying%20a%20battery" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl py-3.5 px-4 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md font-semibold text-sm w-full group">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Chat on WhatsApp
                    </a>
                    
                    <a href="tel:+919667123456" className="flex items-center justify-center gap-2.5 bg-background hover:bg-muted border-2 border-border text-foreground rounded-xl py-3.5 px-4 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md font-semibold text-sm w-full group">
                      <PhoneCall className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                      +91 9667123456
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* TABS SECTION */}
      <Container size="xl" className="mt-12">
        <Tabs defaultValue="specs" className="w-full bg-background rounded-xl border shadow-sm p-2 sm:p-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 bg-muted/50 p-1 h-auto">
            <TabsTrigger value="specs" className="text-sm sm:text-base py-2 data-[state=active]:shadow-sm">Specifications</TabsTrigger>
            <TabsTrigger value="desc" className="text-sm sm:text-base py-2 data-[state=active]:shadow-sm">Description</TabsTrigger>
            <TabsTrigger value="vehicles" className="text-sm sm:text-base py-2 data-[state=active]:shadow-sm">Compatible Vehicles</TabsTrigger>
            <TabsTrigger value="policy" className="text-sm sm:text-base py-2 data-[state=active]:shadow-sm whitespace-normal text-center h-auto">Replacement Policy</TabsTrigger>
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
            {displayVehicles && displayVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayVehicles.map((v) => (
                  <div key={v.vehicleId} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
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
                        {[v.fuelType].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No Compatibility Data" description="Vehicle compatibility is not available for this product yet." />
            )}
          </TabsContent>

          <TabsContent value="policy" className="p-2 sm:p-4 outline-none">
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <h4 className="text-lg font-bold text-foreground mb-4">Replacement Policy</h4>
              <p className="mb-2"><strong>a)</strong> You may initiate the request for replacement of the Product within two days from the time the Product (s) is delivered to you ("Replacement Period") if:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li><strong>(i)</strong> the Product is received in a physically damaged condition and reported to us within 24 hours of delivery.</li>
                <li><strong>(ii)</strong> Product is faulty or is not in a working situation, to be reported to us within 24 hours of delivery;</li>
                <li><strong>(iii)</strong> Product or parts of the Product or accessory are missing, reported to us within 24 hours of delivery.</li>
              </ul>
              <p className="mb-4 text-sm text-foreground/80 bg-muted/50 p-4 rounded-lg border">
                All our packages come with <strong>"Tamper Evident Void Seals."</strong> Please ensure that you do not accept packages where the seal has been tampered with. Approval of a tampered "Void Seal" or a harmed box will automatically disqualify you from any replacement declarations for physically damaged/faulty products, wrong Products, or missing accessories.
              </p>
              
              <p className="mb-4"><strong>b)</strong> You shall keep the Products in their unused, original condition, along with the original invoice/ sale receipt, brand outer box, MRP tags attached, user manual, warranty cards, and original supplements in manufacturer packaging for a victorious replacement pick-up. We would accept the request for the replacement of such Product subject to the terms of this policy.</p>
              
              <p className="mb-4"><strong>c)</strong> Your replacement will be processed only when the conditions as may be stipulated by us are fulfilled at the time of replacement of such Products, such as the Product to be replaced being provided to us in the original condition along with the price tag intact including original packaging of the Product, the serial number/ bar code of the Product matches our records, if Product(s) bought as a combo then Product(s) sent for a replacement to be as a complete combo, the brand outer packaging of the Product and all accessories therein shall be intact, no damage has occurred post-delivery of the Product while in your possession, etc.</p>

              <p className="mb-6"><strong>d)</strong> You agree that we will not replace any Product: (i) if you have placed the order for a wrong Product model, color, or incorrect Product, (ii) if the Product belongs to the non-replacement Product category (iii) if you fail to request replacement/register a complaint about a damaged, defective or inaccurate Product within the Replacement Period. Any damage to the Product caused by your improper use of the Product, any modification or change to the Product by you, the User, or a third party, or any depreciation in the value for other reasons will not be deemed such Product a damaged defective or inaccurate Product. It will not be considered a quality problem. Any judgment by us in this respect shall be final and binding.</p>

              <div className="border-l-4 border-brand pl-4 bg-brand/5 py-4 pr-4 rounded-r-lg">
                <p className="font-semibold text-foreground m-0">Note: we only give a product replacement; no return is applicable.</p>
                <p className="mt-1 text-sm text-foreground/80">For more details about replacement policy, Call us at <a href="tel:+919200920051" className="text-brand hover:underline font-medium">+91-9200920051</a></p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
      
      <GlobalFaqSection 
        pageType="PRODUCT" 
        context={{
          product_name: data.productName,
          brand_name: data.brandName || "Brand",
          category_name: data.productCategory || "Battery",
          city_name: city?.cityName || "your city",
          warranty_name: String(allFlatSpecs.find((s: any) => s[0].toLowerCase().includes("warranty"))?.[1] || ""),
          price_name: data.productPrice?.toString() || "",
          mrp_name: (data.productPrice * 1.2).toFixed(2),
          capa_ct_name: String(allFlatSpecs.find((s: any) => s[0].toLowerCase().includes("capacity"))?.[1] || ""),
        }} 
      />

      <RelatedProducts currentProductId={id} currentProduct={data} />
      <Container size="xl" className="pb-8">
        <SeoCityLinks productName={data.productName} />
      </Container>

      {/* FULLSCREEN GALLERY APP OVERLAY */}
      {isFullscreenGallery && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-end z-[1001] pointer-events-none">
            <button 
              onClick={() => setIsFullscreenGallery(false)}
              className="text-white p-2 sm:p-3 rounded-full hover:bg-white/10 transition-colors pointer-events-auto bg-black/20"
            >
              <X className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
          </div>
          
          <Carousel 
            opts={{ startIndex: initialSlide, loop: true }} 
            className="w-full h-full flex items-center justify-center"
          >
            <CarouselContent className="ml-0 w-full">
              {galleryImages.map((img, idx) => (
                <CarouselItem key={idx} className="pl-0 basis-full flex items-center justify-center h-[100dvh]">
                  <div className="w-full h-full p-4 sm:p-12 flex items-center justify-center relative">
                    <img 
                      src={img} 
                      alt={`Gallery view ${idx + 1}`} 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {galleryImages.length > 1 && (
              <>
                <CarouselPrevious className="left-4 sm:left-8 bg-white/10 text-white border-none hover:bg-white/30 hidden sm:flex h-12 w-12 sm:h-16 sm:w-16 shadow-lg backdrop-blur-md" />
                <CarouselNext className="right-4 sm:right-8 bg-white/10 text-white border-none hover:bg-white/30 hidden sm:flex h-12 w-12 sm:h-16 sm:w-16 shadow-lg backdrop-blur-md" />
              </>
            )}
          </Carousel>
        </div>
      )}
    </div>
  );
}

function RelatedProducts({ currentProductId, currentProduct }: { currentProductId: string; currentProduct?: any }) {
  const { data: allProducts } = useQuery(productListQuery());
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const filtered = allProducts.filter((p: any) => p.productId !== currentProductId);
      
      let matched = [...filtered];
      
      if (currentProduct) {
        const strictMatch = filtered.filter((p: any) => 
          p.productCategory === currentProduct.categoryName && 
          p.brandName === currentProduct.brandName
        );
        
        const categoryMatch = filtered.filter((p: any) => 
          p.productCategory === currentProduct.categoryName && 
          p.brandName !== currentProduct.brandName
        );
        
        const others = filtered.filter((p: any) => p.productCategory !== currentProduct.categoryName);
        
        matched = [...strictMatch, ...categoryMatch, ...others];
      } else {
        matched.sort(() => 0.5 - Math.random());
      }
      
      setRelated(matched.slice(0, 4));
    }
  }, [allProducts, currentProductId, currentProduct]);

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
