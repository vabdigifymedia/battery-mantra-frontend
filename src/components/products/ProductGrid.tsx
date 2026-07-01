import { SkeletonCard } from "@/components/feedback/SkeletonPresets";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ProductCard } from "./ProductCard";
import type { ProductListResponse } from "@/types/dto";
import { cn } from "@/lib/utils";

type Props = {
  products: ProductListResponse[] | undefined;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
  className?: string;
};

export function ProductGrid({
  products,
  loading,
  emptyTitle = "No products found",
  emptyDescription = "Try changing your filters or search terms.",
  skeletonCount = 8,
  className,
}: Props) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  if (!products || products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((p) => (
        <ProductCard key={p.productId} product={p} />
      ))}
    </div>
  );
}
