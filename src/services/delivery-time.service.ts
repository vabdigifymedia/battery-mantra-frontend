import { apiFetch } from "@/lib/api/client";

export interface DeliveryTimeRequest {
  categoryId: string;
  cityId: string;
  days: string;
  hours: string;
}

export interface DeliveryTimeResponse {
  id: string;
  categoryId: string;
  cityId: string;
  days: string;
  hours: string;
}

export const deliveryTimeService = {
  // Admin endpoints
  getAllDeliveryTimes: () =>
    apiFetch<DeliveryTimeResponse[]>("/api/admin/delivery-time", { method: "GET" }),
  
  updateDeliveryTimes: (requests: DeliveryTimeRequest[]) =>
    apiFetch<DeliveryTimeResponse[]>("/api/admin/delivery-time", { method: "PUT", body: requests }),

  // Public endpoints
  getDeliveryTime: (categoryId: string, cityId: string) =>
    apiFetch<DeliveryTimeResponse>(`/api/public/delivery-time?categoryId=${categoryId}&cityId=${cityId}`, { method: "GET", auth: false }),

  getDeliveryTimesByCity: (cityId: string) =>
    apiFetch<DeliveryTimeResponse[]>(`/api/public/delivery-times/city/${cityId}`, { method: "GET", auth: false }),
};
