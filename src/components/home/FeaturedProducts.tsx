import { useQuery } from "@tanstack/react-query";
import { productListQuery } from "@/queries";
import { ProductGrid } from "@/components/products/ProductGrid";
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

  return <ProductGrid products={products} loading={isLoading} skeletonCount={limit} />;
}
