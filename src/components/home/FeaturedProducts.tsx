import { useQuery } from "@tanstack/react-query";
import { productListQuery } from "@/queries";
import { ProductGrid } from "@/components/products/ProductGrid";

export function FeaturedProducts({ limit = 8 }: { limit?: number }) {
  const { data, isLoading, isError } = useQuery(productListQuery());

  if (isError) return null;

  const products = (data ?? []).slice(0, limit);
  if (!isLoading && products.length === 0) return null;

  return <ProductGrid products={products} loading={isLoading} skeletonCount={limit} />;
}
