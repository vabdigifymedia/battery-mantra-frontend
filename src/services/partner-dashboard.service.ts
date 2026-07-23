import { apiFetch } from "@/lib/api/client";
import type { OrderResponse, ProductDetailResponse, CityPricingDto } from "@/types/dto";
import type { EngineerProfile, CreateEngineerRequest } from "@/services/engineer.service";

export const partnerDashboardService = {
  getMyProfile: (signal?: AbortSignal) =>
    apiFetch<any>("/api/partner/profile", { signal }),

  listAssignedOrders: (signal?: AbortSignal) =>
    apiFetch<OrderResponse[]>("/api/partner/orders", { signal }),
  
  updateOrderStatus: (orderId: string, newStatus: string) =>
    apiFetch<OrderResponse>(`/api/partner/orders/${orderId}/status?newStatus=${newStatus}`, { 
      method: "PUT" 
    }),

  assignEngineer: (orderId: string, engineerId: string) =>
    apiFetch<OrderResponse>(`/api/partner/orders/${orderId}/assign-engineer?engineerId=${engineerId}`, { 
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

  requestNewProduct: (data: any) =>
    apiFetch<ProductDetailResponse>("/api/partner/products", {
      method: "POST",
      body: data,
    }),

  updateCityPricing: (productId: string, data: CityPricingDto) =>
    apiFetch<ProductDetailResponse>(`/api/partner/products/${productId}/city-pricing`, {
      method: "PUT",
      body: data,
    }),
};
