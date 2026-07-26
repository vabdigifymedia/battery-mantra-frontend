import { Link } from "@tanstack/react-router";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import type { ProductListResponse } from "@/types/dto";
import { useWishlist } from "@/providers/WishlistProvider";
import { Heart } from "lucide-react";

export function ProductCard({
  product,
  className,
}: {
  product: ProductListResponse;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.productId);

  return (
    <Link
      to="/products/$id"
      params={{ id: product.seo?.slug || product.productId }}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-border bg-card shadow-product transition-all hover:-translate-y-0.5 hover:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative",
        className,
      )}
    >
      <div className="relative">
        <Image
          src={product.productImage}
          alt={product.productName}
          aspect="square"
          rounded={false}
          className="rounded-none"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-black/5 text-slate-400 hover:text-rose-500 hover:bg-white transition-all shadow-sm z-10"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("w-5 h-5 transition-all", wishlisted && "fill-rose-500 text-rose-500 scale-110")} />
        </button>
      </div>
      <div className="space-y-1.5 p-4">
        {product.brandName ? (
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brandName}
          </p>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground group-hover:text-primary">
          {product.productName}
        </h3>
        {product.productCategory ? (
          <p className="truncate text-xs text-muted-foreground">{product.productCategory}</p>
        ) : null}
        <div className="flex flex-col pt-1">
          {(product.exchangeDiscount ?? 0) > 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <Price value={Math.max(0, product.productPrice - (product.exchangeDiscount || 0))} size="md" />
                <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-medium border border-success/20">With Exchange</span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 font-medium line-through decoration-muted-foreground/50">
                ₹{product.productPrice.toLocaleString()}
              </span>
            </>
          ) : (
            <Price value={product.productPrice} size="md" />
          )}
        </div>
      </div>
    </Link>
  );
}
