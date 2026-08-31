import { SkeletonCard } from "@/components/feedback/SkeletonPresets";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ProductCard } from "./ProductCard";
import type { ProductListResponse } from "@/types/dto";
import { cn } from "@/lib/utils";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useState, useRef } from "react";

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
  const [isMounted, setIsMounted] = useState(false);
  const [cols, setCols] = useState(2);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const updateCols = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(4);
      else if (w >= 768) setCols(3);
      else setCols(2);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  if (loading && (!products || products.length === 0)) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  if (!products || products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  if (!isMounted) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
        {products.slice(0, 12).map((p) => (
          <ProductCard key={p.productId} product={p} />
        ))}
      </div>
    );
  }

  const rowCount = Math.ceil(products.length / cols);
  
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 450, // Initial estimate
    overscan: 3,
  });

  return (
    <div ref={gridRef} className={className} style={{ position: 'relative', height: `${virtualizer.getTotalSize()}px`, width: '100%' }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const rowProducts = products.slice(virtualRow.index * cols, (virtualRow.index + 1) * cols);
        
        return (
          <div
            key={virtualRow.index}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className={cn(
              "grid gap-3 sm:gap-4 pb-3 sm:pb-4", 
              cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2"
            )}
          >
            {rowProducts.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
