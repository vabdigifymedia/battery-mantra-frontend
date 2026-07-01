import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { CheckoutRequest, OrderResponse } from "@/types/dto";

export const ordersService = {
  list: (signal?: AbortSignal) =>
    apiFetch<OrderResponse[]>(endpoints.orders.list, { signal }),
  byId: (orderId: string, signal?: AbortSignal) =>
    apiFetch<OrderResponse>(endpoints.orders.byId(orderId), { signal }),
  checkout: (body: CheckoutRequest) =>
    apiFetch<OrderResponse>(endpoints.orders.checkout, { method: "POST", body }),
  cancel: (orderId: string) =>
    apiFetch<OrderResponse>(endpoints.orders.cancel(orderId), { method: "DELETE" }),
};
