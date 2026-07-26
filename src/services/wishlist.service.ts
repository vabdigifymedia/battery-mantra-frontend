import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ProductListResponse, WishlistCheckResponse } from "@/types/dto";

export const wishlistService = {
  list: async (signal?: AbortSignal) => {
    return apiFetch<ProductListResponse[]>(endpoints.wishlist.list, { signal });
  },

  add: async (productId: string) => {
    return apiFetch<void>(endpoints.wishlist.add(productId), { method: "POST" });
  },

  remove: async (productId: string) => {
    return apiFetch<void>(endpoints.wishlist.remove(productId), { method: "DELETE" });
  },

  check: async (productId: string, signal?: AbortSignal) => {
    return apiFetch<WishlistCheckResponse>(endpoints.wishlist.check(productId), { signal });
  },
};
