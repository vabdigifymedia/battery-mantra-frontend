import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  PageProductListResponse,
  ProductDetailResponse,
  ProductFilterParams,
  ProductListResponse,
} from "@/types/dto";

export const productsService = {
  list: (signal?: AbortSignal) =>
    apiFetch<ProductListResponse[]>(endpoints.products.list, { signal, auth: false }),
  filter: (params: ProductFilterParams, signal?: AbortSignal) =>
    apiFetch<PageProductListResponse>(endpoints.products.filter, {
      query: params as Record<string, string | number | undefined>,
      signal,
      auth: false,
    }),
  byId: (id: string, signal?: AbortSignal) =>
    apiFetch<ProductDetailResponse>(endpoints.products.byId(id), { signal, auth: false }),
  byName: (name: string, signal?: AbortSignal) =>
    apiFetch<ProductDetailResponse>(endpoints.products.byName(name), { signal, auth: false }),
};
