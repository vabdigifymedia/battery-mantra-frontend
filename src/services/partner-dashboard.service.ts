import { apiFetch } from "@/lib/api/client";
import type { OrderResponse } from "@/types/dto";
import type { EngineerProfile, CreateEngineerRequest } from "@/services/engineer.service";

export const partnerDashboardService = {
  listAssignedOrders: (signal?: AbortSignal) =>
    apiFetch<OrderResponse[]>("/api/partner/orders", { signal }),
  
  updateOrderStatus: (orderId: string, newStatus: string) =>
    apiFetch<OrderResponse>(`/api/partner/orders/${orderId}/status?newStatus=${newStatus}`, { 
      method: "PUT" 
    }),

  listEngineers: (signal?: AbortSignal) =>
    apiFetch<EngineerProfile[]>("/api/partner/engineers", { signal }),

  createEngineer: (data: CreateEngineerRequest) =>
    apiFetch<EngineerProfile>("/api/partner/engineers", {
      method: "POST",
      body: data,
    }),

  updateEngineer: (id: string, data: CreateEngineerRequest) =>
    apiFetch<EngineerProfile>(`/api/partner/engineers/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteEngineer: (id: string) =>
    apiFetch<void>(`/api/partner/engineers/${id}`, {
      method: "DELETE",
    }),
};
