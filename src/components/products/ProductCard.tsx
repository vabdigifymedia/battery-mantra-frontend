import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import type { ProductListResponse } from "@/types/dto";
import { useWishlist } from "@/providers/WishlistProvider";
import { Heart, Zap, ArrowRight, ShieldCheck } from "lucide-react";

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

  // Determine capacity to display on card badge (e.g. "100 Ah" instead of DIN/RL code)
  const displayCapacity = useMemo(() => {
    // 1. Check specDetails for "Capacity" attribute or value containing "Ah"
    if (product.specDetails && Array.isArray(product.specDetails)) {
      const capSpec = product.specDetails.find(
        (s) =>
          (s.attributeName && /capacity/i.test(s.attributeName)) ||
          (s.value && /\d+\s*Ah/i.test(s.value))
      );
      if (capSpec?.value) return capSpec.value;
    }

    // 2. Try extracting Ah rating from product name (e.g. "45Ah", "100 Ah", "150Ah")
    const matchName = product.productName?.match(/\b(\d+\s*Ah)\b/i);
    if (matchName) return matchName[1];

    // 3. Fallback: if product.capacity does NOT look like a DIN/Layout code (e.g. "35Ah")
    if (
      product.capacity &&
      !/din|car|truck|suv|lh|rh/i.test(product.capacity) &&
      /\d/.test(product.capacity)
    ) {
      return product.capacity;
    }

    return null;
  }, [product]);

  return (
    <Link
      to="/products/$id"
      params={{ id: product.seo?.slug || product.productId }}
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative h-full",
        className,
      )}
    >
      <div>
        {/* Top Badges Bar - Clean & Responsive */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {hasExchange ? (
              <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
                Save ₹{product.exchangeDiscount?.toLocaleString()}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold bg-amber-500/90 text-white px-2 py-0.5 rounded-full shadow-xs">
                <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                Warranty
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
            className="pointer-events-auto p-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-rose-500 hover:bg-background transition-all shadow-xs"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all",
                wishlisted && "fill-rose-500 text-rose-500 scale-110",
              )}
            />
          </button>
        </div>

        {/* Product Image Stage */}
        <div className="relative pt-8 pb-3 px-3 sm:p-4 flex items-center justify-center bg-gradient-to-b from-muted/30 to-transparent aspect-[4/3] overflow-hidden">
          <Image
            src={product.productImage}
            alt={product.productName}
            aspect="square"
            rounded={false}
            className="rounded-none object-contain h-full w-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply drop-shadow-sm"
          />
        </div>

        {/* Card Details */}
        <div className="p-3 sm:p-4 pt-1 sm:pt-2 space-y-2">
          {/* Brand & Capacity Header */}
          <div className="flex items-center justify-between gap-1">
            {product.brandName && (
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary truncate">
                {product.brandName}
              </span>
            )}
            {displayCapacity && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/15 shrink-0">
                <Zap className="w-2.5 h-2.5 shrink-0 text-primary" />
                {displayCapacity}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="line-clamp-2 min-h-[2.25rem] text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {product.productName}
          </h3>

          {/* Price Display Block */}
          <div className="pt-1">
            {hasExchange ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <Price value={exchangePrice} size="sm" className="font-extrabold text-foreground text-sm sm:text-base" />
                  <span className="text-[9px] sm:text-[10px] bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-600/20 shrink-0">
                    With Exchange
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  MRP: <span className="line-through">₹{product.productPrice.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Price value={product.productPrice} size="sm" className="font-extrabold text-sm sm:text-base" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: View Details CTA */}
      <div className="px-3 sm:px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[11px] font-semibold text-primary">
        <span className="truncate">View Details</span>
        <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}


