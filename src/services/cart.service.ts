import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  AddToCartRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "@/types/dto";

export const cartService = {
  get: (signal?: AbortSignal) =>
    apiFetch<CartResponse>(endpoints.cart.get, { signal }),
  add: (body: AddToCartRequest) =>
    apiFetch<CartResponse>(endpoints.cart.add, { method: "POST", body }),
  update: (cartItemId: string, body: UpdateCartItemRequest) =>
    apiFetch<CartResponse>(endpoints.cart.updateItem(cartItemId), {
      method: "PATCH",
      body,
    }),
  remove: (cartItemId: string) =>
    apiFetch<CartResponse>(endpoints.cart.removeItem(cartItemId), { method: "DELETE" }),
  clear: () =>
    apiFetch<void>(endpoints.cart.clear, { method: "DELETE" }),
};
