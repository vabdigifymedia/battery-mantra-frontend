import { apiFetch } from "@/lib/api/client";
import type { OrderResponse } from "@/types/dto";

export const partnerDashboardService = {
  listAssignedOrders: (signal?: AbortSignal) =>
    apiFetch<OrderResponse[]>("/api/partner/orders", { signal }),
  
  updateOrderStatus: (orderId: string, newStatus: string) =>
    apiFetch<OrderResponse>(`/api/partner/orders/${orderId}/status?newStatus=${newStatus}`, { 
      method: "PUT" 
    }),
};
