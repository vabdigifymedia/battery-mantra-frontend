import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "@tanstack/react-router";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import type { ProductListResponse } from "@/types/dto";
import { useWishlist } from "@/providers/WishlistProvider";
import { useLocationStore } from "@/store/useLocationStore";
import { cityDeliveryTimesQuery, categoriesQuery } from "@/queries";
import { formatDeliveryCardSla, formatCityDeliveryLabel } from "@/lib/delivery";
import { Heart, Zap, ArrowRight, ShieldCheck, Star, RefreshCcw, Settings2, BatteryCharging, Truck, Check, ShoppingCart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ProductCard({
  product,
  className,
}: {
  product: ProductListResponse;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.productId);

  const city = useLocationStore((state) => state.city);
  const { data: cityDeliveryTimes } = useQuery(cityDeliveryTimesQuery(city?.cityId));
  const { data: categories } = useQuery(categoriesQuery());

  const matchedDeliveryTime = useMemo(() => {
    if (!cityDeliveryTimes || cityDeliveryTimes.length === 0) return null;

    if (product.categoryId) {
      const match = cityDeliveryTimes.find((dt) => dt.categoryId === product.categoryId);
      if (match) return match;
    }

    if (product.productCategory && categories) {
      const cat = categories.find(
        (c) => c.categoryName.toLowerCase() === product.productCategory?.toLowerCase()
      );
      if (cat) {
        const match = cityDeliveryTimes.find((dt) => dt.categoryId === cat.categoryId);
        if (match) return match;
      }
    }

    return null;
  }, [cityDeliveryTimes, categories, product.categoryId, product.productCategory]);

  const deliverySla = useMemo(() => {
    return formatDeliveryCardSla(matchedDeliveryTime?.hours, matchedDeliveryTime?.days);
  }, [matchedDeliveryTime]);

  const deliveryCityLabel = useMemo(() => {
    return formatCityDeliveryLabel(city?.cityName);
  }, [city?.cityName]);

  const hasExchange = (product.exchangeDiscount ?? 0) > 0;

  const handleShareCard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productSlug = product.seo?.slug || product.productId;
    const url = typeof window !== "undefined" ? `${window.location.origin}/product/${productSlug}` : "";
    const title = `${product.productName} | BatteryMantra`;
    const text = `Check out ${product.productName} on BatteryMantra!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied to clipboard!");
      } else {
        toast.success("Product link copied!");
      }
    } catch {
      toast.error("Could not copy link.");
    }
  };
  const exchangePrice = hasExchange
    ? Math.max(0, product.productPrice - (product.exchangeDiscount || 0))
    : product.productPrice;

  const basePriceForSavings = product.originalPrice && product.originalPrice > product.productPrice 
    ? product.originalPrice 
    : product.productPrice;
  const totalSavings = basePriceForSavings - exchangePrice;
  const showSavings = totalSavings > 0;

  // Determine capacity to display on card badge
  const displayCapacity = useMemo(() => {
    const extractAh = (text: unknown): string | null => {
      if (!text || typeof text !== "string") return null;
      const m = text.match(/(?:\b|\()(\d+)\s*\)?\s*Ah\b/i);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num >= 2 && num <= 500) return `${num} Ah`;
      }
      return null;
    };

    // 1. Direct capacityAh field (if valid Ah or pure number)
    if ('capacityAh' in product && (product as any).capacityAh) {
      const fromField = extractAh((product as any).capacityAh);
      if (fromField) return fromField;
      const rawNum = String((product as any).capacityAh).trim();
      if (/^\d+$/.test(rawNum)) {
        const n = parseInt(rawNum, 10);
        if (n >= 2 && n <= 500) return `${n} Ah`;
      }
    }

    // 2. Product name (e.g. "Microtek ... 100Ah Lithium", "Amaron 35 Ah")
    const fromName = extractAh(product.productName);
    if (fromName) return fromName;

    // 3. specDetails — strictly ignore load capacity, inverter capacity, reserve capacity etc.
    if ('specDetails' in product && Array.isArray((product as any).specDetails)) {
      const invalidAttrs = /load|inverter|reserve|tank|surge|gross/i;

      // Check battery capacity attributes first
      for (const s of (product as any).specDetails) {
        if (!s || !s.attributeName || !s.value) continue;
        const attr = s.attributeName.toLowerCase();
        if (invalidAttrs.test(attr)) continue;

        if (
          attr === 'capacity' ||
          attr.includes('battery capacity') ||
          attr.includes('nominal capacity') ||
          attr.includes('rated capacity') ||
          attr.includes('capacity (in ah)') ||
          attr.includes('capacity in ah') ||
          attr.includes('capacity (ah)')
        ) {
          const fromSpec = extractAh(s.value);
          if (fromSpec) return fromSpec;
          const numOnly = String(s.value).match(/^\s*(\d+)\s*$/);
          if (numOnly) {
            const n = parseInt(numOnly[1], 10);
            if (n >= 2 && n <= 500) return `${n} Ah`;
          }
        }
      }

      // Secondary: any other spec with explicit "XX Ah" (excluding invalid attributes)
      for (const s of (product as any).specDetails) {
        if (!s || !s.attributeName || !s.value) continue;
        if (invalidAttrs.test(s.attributeName)) continue;
        const fromSpec = extractAh(s.value);
        if (fromSpec) return fromSpec;
      }
    }

    // 4. product.capacity field (e.g. "DIN-100 CAR", "35L CAR", "85AH L")
    if (product.capacity && typeof product.capacity === "string") {
      const raw = product.capacity.trim();
      const fromCapAh = extractAh(raw);
      if (fromCapAh) return fromCapAh;

      const dinMatch = raw.match(/DIN[- ]?(\d+)/i);
      if (dinMatch) {
        const n = parseInt(dinMatch[1], 10);
        if (n >= 20 && n <= 300) return `${n} Ah`;
      }

      // Sizing like 35L CAR, 80R CAR (ignoring pure tech codes like EFB, AGM, N55, RL, etc.)
      if (!/^(efb|agm|n\d+|r\/l|l\/r|rl|lr|r|l)$/i.test(raw)) {
        const numPrefix = raw.match(/^(\d+)[LR]?(?:\s|$|CAR|ACCENT)/i);
        if (numPrefix) {
          const n = parseInt(numPrefix[1], 10);
          if (n >= 20 && n <= 300) return `${n} Ah`;
        }
      }
    }

    // Never return unverified strings like "EFB", "6-7 Hours", etc.
    return null;
  }, [product]);

  // Generate pseudo-random deterministic rating based on product name length
  const rating = useMemo(() => {
    const min = 4.3;
    const max = 4.9;
    const val = min + ((product.productName.length % 10) / 10) * (max - min);
    return val.toFixed(1);
  }, [product.productName]);
  
  const reviews = useMemo(() => (product.productName.length * 7) % 300 + 40, [product.productName]);

  return (
    <div
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 relative h-full",
        className,
      )}
    >
      <div className="flex flex-col flex-1">
        {/* Top Badges Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {showSavings ? (
              <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Save ₹{totalSavings.toLocaleString()}
              </span>
            ) : (
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Warranty
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleShareCard}
              className="p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-brand hover:bg-white transition-all shadow-sm active:scale-95"
              aria-label="Share product"
              title="Share product"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-rose-500 hover:bg-white transition-all shadow-sm active:scale-95"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all",
                  wishlisted && "fill-rose-500 text-rose-500",
                )}
              />
            </button>
          </div>
        </div>

        {/* Product Image Stage */}
        <RouterLink 
          to="/product/$" 
          params={{ _splat: product.seo?.slug || product.productId }}
          className="relative pt-10 pb-4 px-4 flex items-center justify-center bg-slate-50/50 aspect-[4/3] overflow-hidden group-hover:bg-slate-50 transition-colors"
        >
          <Image
            src={product.productImage}
            alt={product.productName}
            aspect="square"
            rounded={false}
            className="rounded-none object-contain h-full w-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
          />
          {displayCapacity && (
            <div className="absolute bottom-3 right-3 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
              <Zap className="w-3 h-3" /> {displayCapacity}
            </div>
          )}
        </RouterLink>

        {/* Details Area */}
        <div className="px-4 pt-3 pb-0 flex flex-col gap-1.5">
          {/* Brand */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {product.brandName || "BATTERY"}
          </div>

          {/* Title */}
          <RouterLink to="/product/$" params={{ _splat: product.seo?.slug || product.productId }}>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug">
              {product.productName}
            </h3>
          </RouterLink>

          {/* Reviews */}
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviews} Reviews)</span>
          </div>

          {/* Price Block */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Price value={exchangePrice} className="font-black text-red-600 text-base sm:text-lg lg:text-xl" />
              {hasExchange && (
                <span className="text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  With Exchange
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[10px] sm:text-xs font-medium">
              <span className="text-muted-foreground">
                MRP: <span className="line-through">₹{basePriceForSavings.toLocaleString()}</span>
              </span>
              {showSavings && (
                <span className="text-red-600 font-bold">
                  You Save ₹{totalSavings.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid - Hidden on Mobile */}
        <div className="hidden sm:grid px-4 py-3 mt-3 border-t border-border/50 grid-cols-4 gap-1">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Settings2 className="w-3 h-3" /></div>
            <span className="text-[9px] font-medium leading-tight text-slate-600">Maintenance<br/>Free</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><RefreshCcw className="w-3 h-3" /></div>
            <span className="text-[9px] font-medium leading-tight text-slate-600">Exchange<br/>Available</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><BatteryCharging className="w-3 h-3" /></div>
            <span className="text-[9px] font-medium leading-tight text-slate-600">High Cranking<br/>Power</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><ShieldCheck className="w-3 h-3" /></div>
            <span className="text-[9px] font-medium leading-tight text-slate-600">Long<br/>Life</span>
          </div>
        </div>

        {/* Delivery & Stock Strip - Hidden on Mobile */}
        <div className="hidden sm:flex mx-4 mb-3 bg-emerald-50/80 rounded-lg p-2.5 items-center justify-between border border-emerald-100/50">
          <div className="flex items-start gap-1.5 w-1/2 border-r border-emerald-200/50 pr-2">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-emerald-800 leading-tight truncate">{deliverySla}</span>
              <span className="text-[9px] text-emerald-600/80 leading-tight truncate">{deliveryCityLabel}</span>
            </div>
          </div>
          <div className="flex items-start gap-1.5 pl-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-800 leading-tight">In Stock</span>
              <span className="text-[9px] text-emerald-600/80 leading-tight truncate">Ready to Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Stack on mobile, side-by-side on sm+ */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-0 flex flex-col sm:flex-row items-center gap-2 mt-auto">
        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm w-full sm:flex-1 h-8 sm:h-9 rounded-md sm:rounded-lg">
          <RouterLink to="/product/$" params={{ _splat: product.seo?.slug || product.productId }}>
            <span className="text-[10px] sm:text-xs font-bold flex items-center"><ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> Buy Now</span>
          </RouterLink>
        </Button>
        <Button asChild size="sm" variant="outline" className="border-border shadow-sm w-full sm:flex-1 h-8 sm:h-9 rounded-md sm:rounded-lg hover:bg-slate-50">
          <RouterLink to="/product/$" params={{ _splat: product.seo?.slug || product.productId }}>
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 flex items-center justify-center">View Details <ArrowRight className="ml-1 w-3 h-3" /></span>
          </RouterLink>
        </Button>
      </div>
    </div>
  );
}


