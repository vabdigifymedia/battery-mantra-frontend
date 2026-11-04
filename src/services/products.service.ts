import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  PageProductListResponse,
  ProductDetailResponse,
  ProductFilterParams,
  ProductListResponse,
  ProductAggregationsResponse,
} from "@/types/dto";

export const productsService = {
  list: (cityId?: string, signal?: AbortSignal) =>
    apiFetch<ProductListResponse[]>(endpoints.products.list, { 
      query: cityId ? { cityId } : undefined,
      signal, 
      auth: false 
    }),
  filter: async (params: ProductFilterParams & { cityId?: string }, signal?: AbortSignal): Promise<PageProductListResponse> => {
    // 1. Attempt server-side filtering first
    try {
      const apiQuery: Record<string, string | number | undefined> = {
        cityId: params.cityId,
        keyword: params.keyword,
        vehicleId: params.vehicleId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        page: params.page ?? 0,
        size: params.size ?? 24,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      };

      // Backend expects a single UUID for brandId and categoryId
      if (params.brandId && params.brandId.length === 1) {
        apiQuery.brandId = params.brandId[0];
      }
      if (params.categoryId && params.categoryId.length === 1) {
        apiQuery.categoryId = params.categoryId[0];
      }

      // If more than 1 brand or category selected, backend single-UUID schema cannot filter them,
      // so we use the client-side fallback directly.
      const hasMultipleBrands = Boolean(params.brandId && params.brandId.length > 1);
      const hasMultipleCategories = Boolean(params.categoryId && params.categoryId.length > 1);

      if (!hasMultipleBrands && !hasMultipleCategories) {
        const res = await apiFetch<PageProductListResponse>(endpoints.products.filter, {
          query: apiQuery,
          signal,
          auth: false,
        });
        if (res && Array.isArray(res.content)) {
          return res;
        }
      }
    } catch (err) {
      console.warn("Backend /api/products/filter unavailable or errored, falling back to client-side catalog filtering:", err);
    }

    // 2. Resilient Client-Side Fallback:
    // If backend /filter fails or multiple filters were selected, filter from products list
    try {
      const allProducts = await productsService.list(params.cityId, signal);
      let filtered = [...allProducts];

      // Brand filter (supports single or multiple brand UUIDs)
      if (params.brandId && params.brandId.length > 0) {
        const brandSet = new Set(params.brandId);
        filtered = filtered.filter(p => (p.brandId && brandSet.has(p.brandId)));
      }

      // Category filter (supports single or multiple category UUIDs)
      if (params.categoryId && params.categoryId.length > 0) {
        const catSet = new Set(params.categoryId);
        filtered = filtered.filter(p => {
          if (p.categoryId && catSet.has(p.categoryId)) return true;
          if (p.categories && p.categories.some(c => catSet.has(c.categoryId))) return true;
          return false;
        });
      }

      // Keyword filter
      if (params.keyword && params.keyword.trim()) {
        const q = params.keyword.toLowerCase().trim();
        filtered = filtered.filter(p => 
          (p.productName && p.productName.toLowerCase().includes(q)) ||
          (p.brandName && p.brandName.toLowerCase().includes(q)) ||
          (p.productCategory && p.productCategory.toLowerCase().includes(q))
        );
      }

      // Price filter
      if (typeof params.minPrice === "number") {
        filtered = filtered.filter(p => (p.productPrice ?? 0) >= params.minPrice!);
      }
      if (typeof params.maxPrice === "number") {
        filtered = filtered.filter(p => (p.productPrice ?? 0) <= params.maxPrice!);
      }

      // Capacity filter
      if (params.capacity && params.capacity.length > 0) {
        filtered = filtered.filter(p => p.capacity && params.capacity!.includes(p.capacity));
      }

      // Warranty filter
      if (params.warranty && params.warranty.length > 0) {
        filtered = filtered.filter(p => p.warranty && params.warranty!.includes(p.warranty));
      }

      // Sorting
      if (params.sortBy === "productPrice") {
        filtered.sort((a, b) => {
          const pa = a.productPrice ?? 0;
          const pb = b.productPrice ?? 0;
          return params.sortDir === "desc" ? pb - pa : pa - pb;
        });
      } else if (params.sortBy === "productName") {
        filtered.sort((a, b) => {
          const na = a.productName || "";
          const nb = b.productName || "";
          return params.sortDir === "desc" ? nb.localeCompare(na) : na.localeCompare(nb);
        });
      }

      const totalElements = filtered.length;
      const size = params.size || 24;
      const page = params.page || 0;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const content = filtered.slice(start, start + size);

      return {
        content,
        totalElements,
        totalPages,
        size,
        number: page,
        numberOfElements: content.length,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
      } as PageProductListResponse;
    } catch (fallbackErr) {
      console.error("Client-side fallback filtering failed:", fallbackErr);
      throw fallbackErr;
    }
  },
  aggregations: async (params: ProductFilterParams & { cityId?: string }, signal?: AbortSignal): Promise<ProductAggregationsResponse> => {
    try {
      return await apiFetch<ProductAggregationsResponse>(endpoints.products.aggregations, {
        query: params as Record<string, string | number | undefined>,
        signal,
        auth: false,
      });
    } catch {
      // Backend does not implement /api/products/aggregations. Return empty object safely.
      return { brands: [], capacities: [], warranties: [] };
    }
  },
  byId: (id: string, cityId?: string, signal?: AbortSignal) =>
    apiFetch<ProductDetailResponse>(endpoints.products.byId(id), { 
      query: cityId ? { cityId } : undefined,
      signal, 
      auth: false 
    }),
  byName: (name: string, cityId?: string, signal?: AbortSignal) =>
    apiFetch<ProductDetailResponse>(endpoints.products.byName(name), { 
      query: cityId ? { cityId } : undefined,
      signal, 
      auth: false 
    }),
};
