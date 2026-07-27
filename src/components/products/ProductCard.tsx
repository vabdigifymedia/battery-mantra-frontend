import { Link } from "@tanstack/react-router";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import type { ProductListResponse } from "@/types/dto";
import { useWishlist } from "@/providers/WishlistProvider";
import { Heart, ShieldCheck, Zap, Truck, ArrowRight } from "lucide-react";

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

  return (
    <Link
      to="/products/$id"
      params={{ id: product.seo?.slug || product.productId }}
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative h-full",
        className,
      )}
    >
      <div>
        {/* Top Badges Overlay Bar */}
        <div className="flex items-center justify-between p-2.5 pb-0 z-10 relative">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-full shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />
            Warranty Assured
          </span>

          <div className="flex items-center gap-1.5">
            {hasExchange && (
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                Save ₹{product.exchangeDiscount?.toLocaleString()}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="p-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/60 text-muted-foreground hover:text-rose-500 hover:bg-background transition-all shadow-2xs z-20"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-all",
                  wishlisted && "fill-rose-500 text-rose-500 scale-110",
                )}
              />
            </button>
          </div>
        </div>

        {/* Product Image Stage */}
        <div className="relative p-4 flex items-center justify-center bg-gradient-to-b from-transparent via-muted/20 to-muted/40 aspect-[4/3] overflow-hidden">
          <Image
            src={product.productImage}
            alt={product.productName}
            aspect="square"
            rounded={false}
            className="rounded-none object-contain h-full w-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply drop-shadow-md"
          />
        </div>

        {/* Details Content */}
        <div className="p-4 pt-3 space-y-2.5">
          {/* Brand & Category Header */}
          <div className="flex items-center justify-between gap-2">
            {product.brandName && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {product.brandName}
              </span>
            )}
            {product.productCategory && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                {product.productCategory}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {product.productName}
          </h3>

          {/* Quick Specs Chip */}
          {product.capacity && (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/15">
              <Zap className="w-3 h-3 text-primary shrink-0" />
              <span>{product.capacity}</span>
            </div>
          )}

          {/* Pricing Box */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1 mt-1">
            {hasExchange ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Price value={exchangePrice} size="md" className="font-extrabold text-foreground" />
                    <span className="text-[9px] bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-600/20">
                      With Exchange
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 border-t border-border/40 mt-1">
                  <span>Without Exchange:</span>
                  <span className="font-medium text-foreground">
                    ₹{product.productPrice.toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium">Best Price:</span>
                <Price value={product.productPrice} size="md" className="font-extrabold" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Delivery Promise & Action Button */}
      <div className="px-4 pb-3.5 pt-0 mt-1 border-t border-border/40 flex items-center justify-between gap-2 pt-2.5">
        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          <span>Express Delivery</span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

