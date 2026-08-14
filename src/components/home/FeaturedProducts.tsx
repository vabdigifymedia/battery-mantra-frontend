import { useQuery } from "@tanstack/react-query";
import { productListQuery } from "@/queries";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductCard } from "@/components/products/ProductCard";
import type { ProductListResponse } from "@/types/dto";

export function FeaturedProducts({ 
  limit = 8,
  filterFn,
  sortFn
}: { 
  limit?: number;
  filterFn?: (p: ProductListResponse) => boolean;
  sortFn?: (a: ProductListResponse, b: ProductListResponse) => number;
}) {
  const { data, isLoading, isError } = useQuery(productListQuery());

  if (isError) return null;

  const rawList = Array.isArray(data) ? data : (data as any)?.content || [];
  let products = Array.isArray(rawList) ? [...rawList] : [];

  if (filterFn) {
    products = products.filter(filterFn);
  }
  
  if (sortFn) {
    products = products.sort(sortFn);
  }

  products = products.slice(0, limit);

  if (!isLoading && products.length === 0) return null;

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="w-[160px] min-w-[160px] xs:w-[180px] xs:min-w-[180px] sm:w-[280px] sm:min-w-[280px] md:w-[320px] md:min-w-[320px] lg:w-[340px] lg:min-w-[340px] snap-start shrink-0">
            <div className="h-[280px] sm:h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
      {products.map((p) => (
        <div key={p.productId} className="w-[160px] min-w-[160px] xs:w-[180px] xs:min-w-[180px] sm:w-[280px] sm:min-w-[280px] md:w-[320px] md:min-w-[320px] lg:w-[340px] lg:min-w-[340px] snap-start shrink-0 h-auto flex">
          <ProductCard product={p} className="w-full flex-1" />
        </div>
      ))}
    </div>
  );
}
