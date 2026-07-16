import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  PageProductListResponse,
  ProductDetailResponse,
  ProductFilterParams,
  ProductListResponse,
} from "@/types/dto";

export const productsService = {
  list: (cityId?: string, signal?: AbortSignal) =>
    apiFetch<ProductListResponse[]>(endpoints.products.list, { 
      query: cityId ? { cityId } : undefined,
      signal, 
      auth: false 
    }),
  filter: (params: ProductFilterParams & { cityId?: string }, signal?: AbortSignal) =>
    apiFetch<PageProductListResponse>(endpoints.products.filter, {
      query: params as Record<string, string | number | undefined>,
      signal,
      auth: false,
    }),
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
