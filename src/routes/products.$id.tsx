import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect, startTransition } from "react";
import { z } from "zod";
import { 
  Clock, Check, RefreshCcw, Tag, Truck, CheckCircle2, FileText, 
  Share2, MapPin, Search, Plus, Minus, Battery, ShieldAlert, 
  ShoppingCart, ArrowLeft, Heart, Info, AlertCircle, Zap, PhoneCall,
  ShieldCheck, RefreshCw, Settings, PiggyBank, Star, Cpu, Wrench, 
  Maximize, Scale, Activity, Layers, Plug, X, Headset, Building2,
  Award, Flame, TrendingUp, Box
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/products/ProductGallery";
import { SpecificationsTable, flattenSpecs } from "@/components/products/SpecificationsTable";
import { ProductCard } from "@/components/products/ProductCard";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { Price } from "@/components/common/Price";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { AskQuotationModal, CorporateEnquiryModal } from "@/components/products/ProductEnquiryModals";
import { ProductDeliveryInfoBox } from "@/components/products/ProductDeliveryInfoBox";
import { LiveSearchBox } from "@/components/forms/LiveSearchBox";
import { cn, applySeoTemplate, toSlug } from "@/lib/utils";
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
  head: ({ loaderData }) => {
    const seo = (loaderData?.specs?.seo as any) || loaderData?.seo;
    const city = useLocationStore.getState().city;
    const cityName = city?.cityName || "";
    
    // Fallback logic: Use city fields if city is selected AND city field exists, otherwise use default fields.
    let title = (city && seo?.metaTitleCity) ? seo.metaTitleCity : seo?.metaTitle;
    let desc = (city && seo?.metaDescriptionCity) ? seo.metaDescriptionCity : seo?.metaDescription;
    let keywords = (city && seo?.metaKeywordsCity) ? seo.metaKeywordsCity : seo?.metaKeywords;
    let ogTitle = (city && seo?.ogTitleCity) ? seo.ogTitleCity : seo?.ogTitle;
    let ogDesc = (city && seo?.ogDescriptionCity) ? seo.ogDescriptionCity : seo?.ogDescription;

    const replacePlaceholders = (str: string | undefined | null) => {
      if (!str) return "";
      // E.g., assume 2-4 Hours if we don't have exact time synchronously
      return str.replace(/city_name/gi, cityName || "India").replace(/delivery_time/gi, "2-4 Hours");
    };

    title = replacePlaceholders(title) || (loaderData ? `${loaderData.productName} · BatteryMantra` : "Product · BatteryMantra");
    desc = replacePlaceholders(desc) || (loaderData ? `Buy ${loaderData.productName} at best price on BatteryMantra.` : "Buy batteries at best price.");
    keywords = replacePlaceholders(keywords);
    ogTitle = replacePlaceholders(ogTitle);
    ogDesc = replacePlaceholders(ogDesc);

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: keywords },
        { property: "og:title", content: ogTitle },
        { property: "og:description", content: ogDesc },
        { name: "robots", content: "index,follow" }
      ].filter(m => ('title' in m) || m.content),
      links: loaderData?.productImage ? [
        { rel: "preload", as: "image", href: loaderData.productImage, fetchpriority: "high" }
      ] : [],
    };
  },
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
  pendingComponent: () => (
    <div className="min-h-[101vh] flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Battery className="h-8 w-8 animate-pulse opacity-50" />
        <span className="text-sm font-medium">Loading product...</span>
      </div>
    </div>
  ),
});

function PdpPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(productDetailQuery(id));
  const { status } = useAuth();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [isCorporateOpen, setIsCorporateOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [showDeliveryPill, setShowDeliveryPill] = useState(true);
  const hasExchangeOffer = (data.exchangeDiscount ?? 0) > 0;
  const [exchange, setExchange] = useState<"no" | "yes">(hasExchangeOffer ? "yes" : "no");
  
  const [activeImage, setActiveImage] = useState<string | null>(data?.productImage || null);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  const { isServiceable, pincode, city } = useLocationStore();
  const locationChecked = Boolean(pincode || city);
  const blockPurchase = locationChecked && !isServiceable;

  const vehicles = useQuery(vehiclesListQuery());
  const displayVehicles = data.capacity 
    ? (vehicles.data || []).filter(v => v.capacity?.split(",").map(c => c.trim()).includes(data.capacity!))
    : [];

  const { data: deliveryTime, isLoading: isLoadingDeliveryTime } = useQuery({
    queryKey: ["delivery-time", data.categoryId, city?.cityId],
    queryFn: () => deliveryTimeService.getDeliveryTime(data.categoryId!, city!.cityId!),
    enabled: !!data.categoryId && !!city?.cityId,
  });

  const inStock = (data.productStock ?? 0) > 0;

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let timer: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowDeliveryPill(false);
      } else {
        setShowDeliveryPill(true);
      }
      lastScrollY = currentScrollY;

      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowDeliveryPill(true);
      }, 2000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (data?.productId) {
      setActiveImage(data.productImage || null);
      setExchange((data.exchangeDiscount ?? 0) > 0 ? "yes" : "no");
      setQty(1);
    }
  }, [data?.productId, data?.productImage, data?.exchangeDiscount]);

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
      navigate({ search: (prev: any) => ({ ...prev, autoAdd: undefined }), replace: true } as any);
      addToCart.mutate();
    } else if (status === "authenticated" && search.autoBuy === "true" && inStock && !addToCart.isPending && !addToCart.isSuccess) {
      navigate({ search: (prev: any) => ({ ...prev, autoBuy: undefined }), replace: true } as any);
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

  const getFallbackSpecs = () => {
    return [...allFlatSpecs]
      .sort((a, b) => getPriorityScore(a[0]) - getPriorityScore(b[0]))
      .slice(0, 6)
      .map(([key, value]) => ({ key, value, id: null }));
  };

  const topSpecs = (data.highlightedSpecAttributeIds && data.highlightedSpecAttributeIds.length > 0 && data.specDetails)
    ? data.highlightedSpecAttributeIds.map((id: string) => {
        const detail = data.specDetails?.find((d: any) => d.attributeId === id);
        if (detail) {
          return { key: detail.attributeName, value: detail.value, id };
        }
        return null;
      }).filter(Boolean)
    : getFallbackSpecs();

  const iconMap: Record<string, any> = {
    ShieldCheck, Battery, Zap, Activity, Wrench, Box, Gauge: Settings, Sparkles: Star,
    Award, Clock, Truck, Flame, Cpu, CheckCircle2, RefreshCw, PiggyBank
  };

  const getSpecIcon = (key: string, id: string | null) => {
    const iconClass = "h-4 w-4 sm:h-5 sm:w-5 text-primary";

    if (id && data.specAttributeIcons && data.specAttributeIcons[id] && iconMap[data.specAttributeIcons[id]]) {
      const IconComp = iconMap[data.specAttributeIcons[id]];
      return <IconComp className={iconClass} />;
    }

    const k = key.toLowerCase();
    if (k.includes("not covered") || k.includes("exclusion")) return <ShieldAlert className={iconClass} />;
    if (k.includes("warranty") || k.includes("life") || k.includes("guarantee")) return <ShieldCheck className={iconClass} />;
    if (k.includes("capacity") || k.includes("ah") || k.includes("battery")) return <Battery className={iconClass} />;
    if (k.includes("type") || k.includes("chemistry")) return <Zap className={iconClass} />;
    if (k.includes("maintenance")) return <Wrench className={iconClass} />;
    if (k.includes("cost") || k.includes("price") || k.includes("saving")) return <PiggyBank className={iconClass} />;
    if (k.includes("bms") || k.includes("compact") || k.includes("size")) return <Cpu className={iconClass} />;
    if (k.includes("dimension") || k.includes("length") || k.includes("width") || k.includes("height")) return <Maximize className={iconClass} />;
    if (k.includes("weight") || k.includes("kg")) return <Scale className={iconClass} />;
    if (k.includes("volt")) return <Activity className={iconClass} />;
    if (k.includes("layout") || k.includes("terminal") || k.includes("polarity")) return <Plug className={iconClass} />;
    if (k.includes("material") || k.includes("alloy") || k.includes("grid")) return <Layers className={iconClass} />;
    return <CheckCircle2 className={iconClass} />;
  };

  const getMrpFromProduct = (prodData: typeof data): number | null => {
    if (!prodData) return null;
    const direct = (prodData as any).originalPrice || (prodData as any).mrp || prodData.specs?.originalPrice || prodData.specs?.mrp || prodData.specs?.MRP;
    if (direct && !isNaN(Number(direct)) && Number(direct) > 0) {
      return Number(direct);
    }
    if (prodData.specs && typeof prodData.specs === "object") {
      for (const [key, value] of Object.entries(prodData.specs)) {
        if (typeof value === "object" && value !== null) {
          for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
            if (/mrp|original\s*price|list\s*price/i.test(subKey)) {
              const num = Number(subVal);
              if (!isNaN(num) && num > 0) return num;
            }
          }
        } else if (/mrp|original\s*price|list\s*price/i.test(key)) {
          const num = Number(value);
          if (!isNaN(num) && num > 0) return num;
        }
      }
    }
    return null;
  };

  const currentPrice = exchange === "yes" && hasExchangeOffer 
    ? Math.max(0, data.productPrice - (data.exchangeDiscount || 0)) 
    : data.productPrice;

  const productMrp = getMrpFromProduct(data);

  // Calculate dynamic strike price & discount based on selected exchange mode
  const strikePrice = (productMrp && productMrp > currentPrice)
    ? productMrp
    : (exchange === "yes" && hasExchangeOffer && data.productPrice > currentPrice ? data.productPrice : null);

  const hasDiscount = Boolean(strikePrice && strikePrice > currentPrice);

  const discountPercent = hasDiscount && strikePrice
    ? Math.round(((strikePrice - currentPrice) / strikePrice) * 100)
    : 0;

  // Generate consistent mock rating & sales data based on product name/id
  const charCodeSum = (data.productName || id || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const mockRating = (4.4 + (charCodeSum % 5) * 0.1).toFixed(1); // e.g., 4.4 to 4.8
  const mockSold = 150 + (charCodeSum % 250); // e.g., 150 to 399+ sold

  // Extract Warranty for Banner — prioritize EXACT "Warranty" over generic ones
  const exactWarrantySpec = allFlatSpecs.find((s: any) => {
    const key = String(s[0]).toLowerCase().trim();
    return key === "warranty" || key === "warrenty" || key === "guarantee";
  });
  const genericWarrantySpec = allFlatSpecs.find((s: any) => {
    const key = String(s[0]).toLowerCase();
    return key.includes("warranty") || key.includes("warrenty") || key.includes("guarantee") || key.includes("period");
  });
  const freeReplacementSpec = allFlatSpecs.find((s: any) => {
    const key = String(s[0]).toLowerCase();
    return key.includes("free replacement") || key.includes("free_replacement");
  });
  const warrantySpec = exactWarrantySpec || genericWarrantySpec || freeReplacementSpec;
  const rawWarranty = (data as any).warranty || (data as any).warrantyPeriod || (data as any).warranty_name;
  const warrantyText = rawWarranty ? String(rawWarranty) : (warrantySpec ? String(warrantySpec[1]) : null);

  const seoContext = {
    product_name: data.productName,
    brand_name: data.brandName || "Brand",
    category_name: data.categoryName || "Battery",
    city_name: city?.cityName || "your city",
    warranty_name: String(allFlatSpecs.find((s: any) => s[0].toLowerCase().includes("warranty"))?.[1] || ""),
    price_name: data.productPrice?.toString() || "",
    mrp_name: ((data.productPrice || 0) * 1.2).toFixed(2),
    capa_ct_name: String(allFlatSpecs.find((s: any) => s[0].toLowerCase().includes("capacity"))?.[1] || ""),
    manufacturer_name: data.brandName || "Manufacturer", // Fallback to brandName if manufacturerName not explicitly returned
  };

  return (
    <div className="bg-muted/30 min-h-screen pb-24 sm:pb-16 pt-14 sm:pt-0">
      {/* Mobile Navbar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b h-14 flex items-center justify-between px-3 shadow-sm">
        {isMobileSearchOpen ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-1 duration-200">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 -ml-1 rounded-full hover:bg-muted text-foreground shrink-0"
              aria-label="Close Search"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <LiveSearchBox
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                onClear={() => setMobileSearchQuery("")}
                onSubmit={() => {
                  if (mobileSearchQuery.trim()) {
                    navigate({ to: "/products", search: { q: mobileSearchQuery.trim() } });
                    setIsMobileSearchOpen(false);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => window.history.back()} className="p-2 -ml-1 rounded-full hover:bg-muted text-foreground" aria-label="Go Back">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 rounded-full hover:bg-muted text-foreground"
                aria-label="Search Products"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link to="/cart" className="p-2 rounded-full hover:bg-muted text-foreground relative" aria-label="View Cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            </div>
          </>
        )}
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
                      onClick={() => {
                        startTransition(() => {
                          setActiveImage(img);
                        });
                      }}
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

              {/* MAIN IMAGE (Clean borderless view, no box in box, no search icon) */}
              <div className="flex-1 w-full relative flex justify-center items-center aspect-[4/3] lg:aspect-square">
                
                {/* 100% Genuine Ribbon Overlay */}
                <div className="absolute top-4 sm:top-6 -left-2 z-20 drop-shadow-md">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-3 sm:px-4 py-1.5 shadow-lg shadow-emerald-500/30 rounded-r-lg flex items-center gap-1.5 border border-l-0 border-emerald-400/50">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    100% Genuine
                  </div>
                  {/* Ribbon Fold effect */}
                  <div className="absolute -bottom-1.5 left-0 w-2 h-1.5 bg-emerald-800" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
                </div>

                {activeImage ? (
                  <button 
                    onClick={() => {
                      const idx = galleryImages.indexOf(activeImage);
                      setInitialSlide(Math.max(0, idx));
                      setIsFullscreenGallery(true);
                    }} 
                    className="w-full h-full cursor-zoom-in outline-none relative group flex items-center justify-center"
                  >
                    <img 
                      src={activeImage} 
                      alt={data.productName} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply" 
                      fetchPriority="high"
                      loading="eager"
                    />
                  </button>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <Battery className="h-16 w-16 mb-2 opacity-20" />
                    <span>No image available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Buy Box */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8">
            {/* Title & Core Details */}
            <div className="space-y-2.5 sm:space-y-4 order-1">
              <div>
                {data.brandName && (
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-brand mb-0.5 sm:mb-1">
                    {data.brandName}
                  </p>
                )}
                <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
                  {data.productName}
                </h1>
              </div>

              {/* Reviews, Sold Stats & Creative Warranty Guarantee Banner */}
              <div className="space-y-2 sm:space-y-3 pt-0.5">
                {/* 1. Rating & Popularity Stats (Mocked) - Compact & Inline on Mobile */}
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 text-xs sm:text-sm">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-amber-900 dark:text-amber-200 font-bold shadow-2xs">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.floor(Number(mockRating)) ? "fill-amber-500 text-amber-500" : "fill-amber-500/30 text-amber-500/40"}`} 
                        />
                      ))}
                    </div>
                    <span className="font-extrabold ml-0.5">{mockRating}</span>
                  </div>

                  <span className="text-muted-foreground/30 hidden sm:inline">•</span>

                  <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-sm shadow-2xs">
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20 animate-pulse shrink-0" />
                    <span><strong className="font-extrabold">{mockSold}+</strong> Sold</span>
                  </div>
                </div>

                {/* 2. Premium Warranty Guarantee Card - Ultra Compact on Phone */}
                {warrantyText && (
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-l-4 border-amber-500 border-y border-r border-amber-500/20 p-2.5 sm:p-4 shadow-2xs sm:shadow-sm transition-all hover:shadow-md group">
                    {/* Subtle Background Decorative Glow */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>
                    
                    <div className="flex items-center sm:items-center gap-2.5 sm:gap-3.5 relative z-10">
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7 stroke-[2.2]" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Brand Warranty</span>
                          </span>
                        </div>
                        <p className="text-xs sm:text-base font-extrabold text-foreground leading-snug sm:leading-snug mt-0.5 truncate sm:whitespace-normal">
                          {warrantyText}
                        </p>
                        <p className="hidden sm:flex text-xs text-muted-foreground mt-1 items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success inline shrink-0" />
                          <span><span className="font-bold text-success dark:text-emerald-400">100% Genuine</span> product with doorstep claim support</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile-Only Compact Exchange Offer (below Brand Warranty, above Price) */}
                {(data.exchangeDiscount ?? 0) > 0 && (
                  <div className="block sm:hidden pt-1 pb-0.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Exchange Offer</span>
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Save ₹{data.exchangeDiscount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            setExchange("no");
                          });
                        }}
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all ${
                          exchange === "no"
                            ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${exchange === "no" ? "border-brand bg-brand" : "border-muted-foreground"}`}>
                              {exchange === "no" && <div className="w-1 h-1 rounded-full bg-white" />}
                            </div>
                            <span className="font-bold text-xs truncate">Buy New</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5 pl-4.5">Keep old</span>
                        </div>
                        <span className="text-xs font-extrabold text-foreground ml-1 shrink-0">
                          ₹{data.productPrice.toLocaleString()}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            setExchange("yes");
                          });
                        }}
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all ${
                          exchange === "yes"
                            ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-600/30"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${exchange === "yes" ? "border-emerald-600 bg-emerald-600" : "border-muted-foreground"}`}>
                              {exchange === "yes" && <div className="w-1 h-1 rounded-full bg-white" />}
                            </div>
                            <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 truncate">With Exchange</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5 pl-4.5">Return old</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 ml-1 shrink-0">
                          ₹{Math.max(0, data.productPrice - (data.exchangeDiscount || 0)).toLocaleString()}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1 sm:pt-2">
                <Price 
                  value={currentPrice} 
                  size="xl" 
                  className="text-4xl tracking-tight" 
                />
                {hasDiscount && strikePrice && (
                  <>
                    <span className="text-2xl text-muted-foreground line-through decoration-muted-foreground/50 font-medium">
                      ₹{strikePrice.toLocaleString()}
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

            {/* Exchange Widget (Desktop Only - order-2) */}
            {(data.exchangeDiscount ?? 0) > 0 && (
              <div className="hidden sm:block space-y-3 order-2">
                <h3 className="font-semibold text-lg">Exchange Offer</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        setExchange("no");
                      });
                    }}
                    className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 text-left transition-colors ${
                      exchange === "no" ? "border-brand bg-brand/5 ring-1 ring-brand/30" : "border-muted hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${exchange === "no" ? "border-brand bg-brand" : "border-muted-foreground"}`}>
                          {exchange === "no" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-medium text-base">Buy New</span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold ml-6">
                      ₹{data.productPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-6 mt-1">Keep your old battery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        setExchange("yes");
                      });
                    }}
                    className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 text-left transition-colors ${
                      exchange === "yes" ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-600/30" : "border-muted hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${exchange === "yes" ? "border-emerald-600 bg-emerald-600" : "border-muted-foreground"}`}>
                          {exchange === "yes" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-medium text-base text-emerald-700 dark:text-emerald-400">With Exchange</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Save ₹{data.exchangeDiscount?.toLocaleString()}</Badge>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 ml-6">
                      ₹{Math.max(0, data.productPrice - (data.exchangeDiscount || 0)).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-6 mt-1">Return old battery</span>
                  </button>
                </div>
              </div>
            )}

            {/* Buy Box & Actions (order-3 - Just below Exchange Offer) */}
            <div className="space-y-6 order-3">
              <div className="fixed bottom-0 left-0 right-0 z-[100] sm:static flex flex-row items-center gap-2 sm:gap-4 px-2.5 pt-2.5 pb-0 sm:p-0 bg-background sm:bg-transparent border-t sm:border-none shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:shadow-none">
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
                
                <div className="flex-1 flex w-full gap-2 sm:gap-3 fixed bottom-0 left-0 right-0 z-[60] p-3 bg-background border-t border-border shadow-[0_-8px_16px_rgba(0,0,0,0.05)] sm:relative sm:z-auto sm:p-0 sm:bg-transparent sm:border-0 sm:shadow-none pb-safe sm:pb-0">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold border-2 hover:bg-brand/5 px-2 bg-background sm:bg-transparent"
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

                {/* Mobile Floating Delivery Pill (Fades away on scroll down, reappears on scroll up or pause) */}
                <div
                  className={cn(
                    "fixed bottom-[74px] left-1/2 -translate-x-1/2 z-[55] sm:hidden flex items-center gap-2 rounded-full bg-slate-900/90 text-white px-3.5 py-1.5 shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-none border border-white/15 text-xs font-semibold whitespace-nowrap",
                    showDeliveryPill
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-95"
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-bold">⚡ Express Delivery:</span>
                  <span>Get it Today in 2-4 Hours</span>
                </div>
              </div>

              {/* Ask for Quotation & Corporate Enquiry Secondary Action Bar */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 sm:h-12 text-xs sm:text-sm font-semibold border-border hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                  onClick={() => setIsQuotationOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-1.5 text-primary shrink-0" />
                  Ask for Quotation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 sm:h-12 text-xs sm:text-sm font-semibold border-border hover:border-blue-500/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 text-foreground transition-all shadow-sm"
                  onClick={() => setIsCorporateOpen(true)}
                >
                  <Building2 className="h-4 w-4 mr-1.5 text-blue-600 shrink-0" />
                  Corporate Enquiry
                </Button>
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
            </div>

            {/* Need Help in Buying Block (order-6 on mobile so it sits below Deliver to XYZ, order-3 on desktop) */}
            <div className="order-6 sm:order-3 pt-6 sm:pt-4 pb-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background to-muted border border-border shadow-md transition-all hover:shadow-lg">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-0"></div>
                
                <div className="p-5 sm:p-6 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 gap-4">
                    <div className="flex gap-4 items-center sm:items-start">
                      <div className="relative shrink-0">
                        <div className="bg-gradient-to-tr from-primary to-primary/60 p-[2px] rounded-full shadow-md">
                          <div className="bg-background rounded-full h-14 w-14 sm:h-16 sm:w-16 overflow-hidden border-2 border-background flex items-center justify-center text-primary">
                            <Headset className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
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
                    <a href="https://wa.me/919200920051?text=Hi,%20I%20need%20help%20buying%20a%20battery" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl py-3.5 px-4 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md font-semibold text-sm w-full group">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Chat on WhatsApp
                    </a>
                    
                    <a href="tel:+919200920051" className="flex items-center justify-center gap-2.5 bg-background hover:bg-muted border-2 border-border text-foreground rounded-xl py-3.5 px-4 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md font-semibold text-sm w-full group">
                      <PhoneCall className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                      +91 9200920051
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features (order-4) */}
            {topSpecs.length > 0 && (
              <div className="pt-4 pb-4 my-2 border-y border-border/50 order-4">
                <h3 className="font-bold text-base sm:text-lg mb-3 text-foreground">Key Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {topSpecs.map((spec: any) => {
                    const { key, value, id } = spec;
                    return (
                      <div
                        key={key}
                        className="flex items-start gap-2 p-2 sm:p-2.5 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors min-w-0"
                      >
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15 shadow-2xs mt-0.5">
                          {getSpecIcon(key, id)}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate mb-0.5">
                            {key}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-foreground leading-snug break-words">
                            {String(value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery & Policy Info Box (order-5 - Bottom of right column on desktop, above expert advice on mobile) */}
            <div className="order-5 pt-6 sm:pt-4">
              <ProductDeliveryInfoBox
                city={city}
                deliveryTimeDays={deliveryTime?.days}
                deliveryTimeHours={deliveryTime?.hours}
              />
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
                dangerouslySetInnerHTML={{ __html: applySeoTemplate(data.productDescription, seoContext) }}
              />
            ) : (
              <EmptyState title="No Description" description="Description is not available for this product yet." />
            )}
          </TabsContent>
          
          <TabsContent value="vehicles" className="p-2 sm:p-4 outline-none">
            {displayVehicles && displayVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayVehicles.map((v) => (
                  <Link 
                    key={v.vehicleId} 
                    to="/batteries-for/$categorySlug/$makeSlug/$modelSlug"
                    params={{
                      categorySlug: v.vehicleType === "BIKE" ? "bike-batteries" : "car-batteries",
                      makeSlug: toSlug(v.make),
                      modelSlug: toSlug(v.model)
                    }}
                    className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                  >
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
                        {[v.fuelName].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  </Link>
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
        context={seoContext} 
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

      {/* Quotation & Corporate Enquiry Modals */}
      <AskQuotationModal
        open={isQuotationOpen}
        onOpenChange={setIsQuotationOpen}
        productId={data.productId}
        productName={data.productName}
        brandName={data.brandName}
        productPrice={data.productPrice}
      />

      <CorporateEnquiryModal
        open={isCorporateOpen}
        onOpenChange={setIsCorporateOpen}
        productId={data.productId}
        productName={data.productName}
        brandName={data.brandName}
      />
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
      
      setRelated(matched.slice(0, 8));
    }
  }, [allProducts, currentProductId, currentProduct]);

  if (!related.length) return null;

  return (
    <Container size="xl" className="mt-12 sm:mt-16 border-t pt-8 sm:pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">More Products You Might Like</h2>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {related.map((p) => (
          <div key={p.productId} className="min-w-[210px] w-[210px] sm:min-w-[240px] sm:w-[240px] shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </Container>
  );
}
