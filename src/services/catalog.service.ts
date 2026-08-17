import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  BrandResponse,
  CategoryDetailResponse,
  CategoryListResponse,
  BannerResponse,
  CreateCallbackRequest,
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
  list: (signal?: AbortSignal, categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : "";
    return apiFetch<BrandResponse[]>(`${endpoints.brands.list}${query}`, { signal, auth: false });
  },
  featured: (signal?: AbortSignal) =>
    apiFetch<BrandResponse[]>(endpoints.brands.featured, { signal, auth: false }),
};

export const bannersService = {
  active: (signal?: AbortSignal) =>
    apiFetch<BannerResponse[]>(endpoints.banners.active, { signal, auth: false }),
};

export const callbacksService = {
  create: (req: CreateCallbackRequest) =>
    apiFetch<void>(endpoints.callbacks.create, {
      method: "POST",
      body: req,
      auth: false,
    }),
};

export const seoService = {
  getPageSeo: (route: string) =>
    apiFetch<{ pageId: string; pageName: string; pageRoute: string; seo: any }>(
      endpoints.seo.pageByRoute(route),
      { auth: false }
    ).catch(() => null),
};
