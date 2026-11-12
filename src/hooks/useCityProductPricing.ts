import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/store/useLocationStore";
import { productListQuery } from "@/queries";
import type { ProductListResponse } from "@/types/dto";

/**
 * Subscribes reactively to the currently selected cityId in useLocationStore.
 */
export function useActiveCityId(): string | undefined {
  return useLocationStore((state) => state.city?.cityId);
}

/**
 * Overlays live city-specific prices, exchange discounts, and stock onto product lists
 * returned by endpoints that may not natively support ?cityId (offers/campaigns, wishlist, blog embeds).
 */
export function useCityPricedProducts<T extends ProductListResponse>(
  products: T[] | undefined | null,
  cityIdOverride?: string,
): T[] {
  const activeCityId = useActiveCityId();
  const cityId = cityIdOverride ?? activeCityId;

  const { data: cityProducts } = useQuery({
    ...productListQuery(cityId),
    enabled: Boolean(cityId && products && products.length > 0),
  });

  return useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!cityId || !Array.isArray(cityProducts) || cityProducts.length === 0) {
      return products;
    }

    const byId = new Map<string, ProductListResponse>();
    for (const cp of cityProducts) {
      if (cp?.productId) byId.set(cp.productId, cp);
    }

    return products.map((p) => {
      const matched = byId.get(p.productId);
      if (!matched) return p;
      return {
        ...p,
        productPrice: matched.productPrice ?? p.productPrice,
        originalPrice: matched.originalPrice ?? p.originalPrice,
        exchangeDiscount: matched.exchangeDiscount ?? p.exchangeDiscount,
        productStock: matched.productStock ?? p.productStock,
      };
    });
  }, [products, cityId, cityProducts]);
}

