import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  BrandResponse,
  CategoryDetailResponse,
  CategoryListResponse,
} from "@/types/dto";

export const categoriesService = {
  list: (signal?: AbortSignal) =>
    apiFetch<CategoryListResponse[]>(endpoints.categories.list, { signal, auth: false }),
  root: (signal?: AbortSignal) =>
    apiFetch<CategoryListResponse[]>(endpoints.categories.root, { signal, auth: false }),
  byId: (id: string, signal?: AbortSignal) =>
    apiFetch<CategoryDetailResponse>(endpoints.categories.byId(id), { signal, auth: false }),
};

export const brandsService = {
  list: (signal?: AbortSignal) =>
    apiFetch<BrandResponse[]>(endpoints.brands.list, { signal, auth: false }),
  featured: (signal?: AbortSignal) =>
    apiFetch<BrandResponse[]>(endpoints.brands.featured, { signal, auth: false }),
};
