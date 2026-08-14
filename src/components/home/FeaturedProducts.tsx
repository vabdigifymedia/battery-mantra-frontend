import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { productListQuery } from "@/queries";
import { ProductCard } from "@/components/products/ProductCard";
import type { ProductListResponse } from "@/types/dto";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300; // Adjust based on your card width
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const cardWidthClasses = "w-[45vw] xs:w-[42vw] sm:w-[280px] md:w-[320px] lg:w-[340px] min-w-[45vw] xs:min-w-[42vw] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[340px]";

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={`${cardWidthClasses} snap-start shrink-0`}>
            <div className="h-[280px] sm:h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Scroll Left Button */}
      <Button 
        variant="secondary" 
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full shadow-md bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-slate-50"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* LazyRow Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p) => (
          <div key={p.productId} className={`${cardWidthClasses} snap-start shrink-0 h-auto flex`}>
            <ProductCard product={p} className="w-full flex-1" />
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      <Button 
        variant="secondary" 
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full shadow-md bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-slate-50"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
