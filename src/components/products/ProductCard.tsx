import { useMemo } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import type { ProductListResponse } from "@/types/dto";
import { useWishlist } from "@/providers/WishlistProvider";
import { Heart, Zap, ArrowRight, ShieldCheck, Star, RefreshCcw, Settings2, BatteryCharging, Truck, Check } from "lucide-react";
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

  const hasExchange = (product.exchangeDiscount ?? 0) > 0;
  const exchangePrice = hasExchange
    ? Math.max(0, product.productPrice - (product.exchangeDiscount || 0))
    : product.productPrice;

  // Determine capacity to display on card badge
  const displayCapacity = useMemo(() => {
    if ('specDetails' in product && Array.isArray((product as any).specDetails)) {
      const capSpec = (product as any).specDetails.find(
        (s: any) =>
          (s.attributeName && /capacity/i.test(s.attributeName)) ||
          (s.value && /\d+\s*Ah/i.test(s.value))
      );
      if (capSpec?.value) return capSpec.value;
    }
    const matchName = product.productName?.match(/\b(\d+\s*Ah)\b/i);
    if (matchName) return matchName[1];
    if (!product.capacity) return null;
    if (/Ah/i.test(product.capacity)) return product.capacity;
    const dinMatch = product.capacity.match(/DIN[- ]?(\d+)/i);
    if (dinMatch) return `${dinMatch[1]} Ah`;
    const numMatch = product.capacity.match(/^(\d+)[LR]?\b/i);
    if (numMatch) return `${numMatch[1]} Ah`;
    return product.capacity;
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
            {hasExchange ? (
              <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Save ₹{product.exchangeDiscount?.toLocaleString()}
              </span>
            ) : (
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Warranty
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="pointer-events-auto p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-rose-500 hover:bg-white transition-all shadow-sm"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all",
                wishlisted && "fill-rose-500 text-rose-500",
              )}
            />
          </button>
        </div>

        {/* Product Image Stage */}
        <RouterLink 
          to="/products/$id" 
          params={{ id: product.seo?.slug || product.productId }}
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
          <RouterLink to="/products/$id" params={{ id: product.seo?.slug || product.productId }}>
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
            <div className="flex items-center gap-2">
              <Price value={exchangePrice} className="font-black text-red-600 text-lg sm:text-xl" />
              {hasExchange && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  With Exchange
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground">
                MRP: <span className="line-through">₹{product.productPrice.toLocaleString()}</span>
              </span>
              {hasExchange && (
                <span className="text-red-600 font-bold">
                  You Save ₹{product.exchangeDiscount?.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-4 py-3 mt-3 border-t border-border/50 grid grid-cols-4 gap-1">
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

        {/* Delivery & Stock Strip */}
        <div className="mx-4 mb-3 bg-emerald-50/80 rounded-lg p-2.5 flex items-center justify-between border border-emerald-100/50">
          <div className="flex items-start gap-1.5 w-1/2 border-r border-emerald-200/50 pr-2">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-800 leading-tight">Delivery in 30-60 min</span>
              <span className="text-[9px] text-emerald-600/80 leading-tight truncate">Noida & Delhi NCR</span>
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

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex items-center gap-2 mt-auto">
        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm flex-1 h-9 rounded-lg">
          <RouterLink to="/products/$id" params={{ id: product.seo?.slug || product.productId }}>
            <span className="text-xs font-bold">🛒 Buy Now</span>
          </RouterLink>
        </Button>
        <Button asChild size="sm" variant="outline" className="border-border shadow-sm flex-1 h-9 rounded-lg hover:bg-slate-50">
          <RouterLink to="/products/$id" params={{ id: product.seo?.slug || product.productId }}>
            <span className="text-xs font-bold text-slate-700 flex items-center">View Details <ArrowRight className="ml-1 w-3 h-3" /></span>
          </RouterLink>
        </Button>
      </div>
    </div>
  );
}


