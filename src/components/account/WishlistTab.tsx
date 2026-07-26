import { useWishlist } from "@/providers/WishlistProvider";
import { ProductCard } from "@/components/products/ProductCard";
import { HeartCrack } from "lucide-react";

export function WishlistTab() {
  const { items, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-muted-foreground">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center bg-muted/20">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <HeartCrack className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">Your wishlist is empty</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Save batteries you are interested in by clicking the heart icon on any product.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <h3 className="text-lg font-medium">Saved Items</h3>
        <p className="text-sm text-muted-foreground">Your favorited batteries for quick access.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
}
