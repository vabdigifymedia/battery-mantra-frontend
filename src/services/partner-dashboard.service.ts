import { apiFetch } from "@/lib/api/client";
import type {
  OrderResponse,
  ProductDetailResponse,
  CityPricingDto,
  CategorySpecTemplateResponse,
} from "@/types/dto";
import type { EngineerProfile, CreateEngineerRequest } from "@/services/engineer.service";

export const partnerDashboardService = {
  getMyProfile: (signal?: AbortSignal) =>
    apiFetch<any>("/api/partner/profile", { signal }),

  listAssignedOrders: (signal?: AbortSignal) =>
    apiFetch<OrderResponse[]>("/api/partner/orders", { signal }),
  
  updateOrderStatus: (orderId: string, newStatus: string, cancellationReason?: string) => {
    let url = `/api/partner/orders/${orderId}/status?newStatus=${newStatus}`;
    if (cancellationReason) {
      url += `&cancellationReason=${encodeURIComponent(cancellationReason)}`;
    }
    return apiFetch<OrderResponse>(url, { method: "PUT" });
  },

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

  uploadProductImage: async (file: File, folder = "products") => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      return await apiFetch<{ url: string; publicId?: string }>("/api/partner/upload", {
        method: "POST",
        query: { folder },
        body: formData,
        multipart: true,
      });
    } catch {
      // Fallback to shared upload endpoint if Partner role is granted access
      return await apiFetch<{ url: string; publicId?: string }>("/api/admin/upload", {
        method: "POST",
        query: { folder },
        body: formData,
        multipart: true,
      });
    }
  },

  getCategorySpecTemplate: async (categoryId: string, signal?: AbortSignal) => {
    try {
      return await apiFetch<CategorySpecTemplateResponse>(
        `/api/specs/template/category/${encodeURIComponent(categoryId)}`,
        { signal }
      );
    } catch {
      try {
        return await apiFetch<CategorySpecTemplateResponse>(
          `/api/admin/specs/template/category/${encodeURIComponent(categoryId)}`,
          { signal }
        );
      } catch {
        return null;
      }
    }
  },

  updateCityPricing: (productId: string, data: CityPricingDto) =>
    apiFetch<ProductDetailResponse>(`/api/partner/products/${productId}/city-pricing`, {
      method: "PUT",
      body: data,
    }),

  addOrderNote: (orderId: string, note: string) =>
    apiFetch<OrderResponse>(`/api/partner/orders/${orderId}/notes`, {
      method: "POST",
      body: { note },
    }),

  requestCityPricingChange: (productId: string, data: { cityId: string; price: number; exchangeDiscount?: number; stock: number; reason: string }) =>
    apiFetch<any>(`/api/partner/products/${productId}/city-pricing-request`, {
      method: "POST",
      body: data,
    }),

  getPendingPricingRequests: (signal?: AbortSignal) =>
    apiFetch<any[]>("/api/partner/products/pending-pricing-requests", { signal }),

  getBranchInventory: (cityId: string, signal?: AbortSignal) =>
    apiFetch<any[]>(`/api/partner/inventory?cityId=${encodeURIComponent(cityId)}`, { signal }),

  updateBranchStock: async (productId: string, cityId: string, stock: number, existingPrice?: number, existingDiscount?: number) => {
    try {
      return await apiFetch<any>(
        `/api/partner/inventory/${productId}/stock?cityId=${encodeURIComponent(cityId)}&stock=${stock}`,
        { method: "PATCH" }
      );
    } catch {
      // Graceful fallback to updating city pricing with preserved price and new stock
      return await apiFetch<ProductDetailResponse>(
        `/api/partner/products/${productId}/city-pricing`,
        {
          method: "PUT",
          body: {
            cityId,
            price: existingPrice ?? 0,
            exchangeDiscount: existingDiscount ?? 0,
            stock,
          },
        }
      );
    }
  },

  bulkUpdateBranchStock: async (
    cityId: string,
    updates: Array<{ productId: string; stock: number; price?: number; exchangeDiscount?: number }>
  ) => {
    try {
      return await apiFetch<{ updatedCount: number; message: string }>(
        "/api/partner/inventory/bulk-update",
        {
          method: "POST",
          body: { cityId, updates: updates.map((u) => ({ productId: u.productId, stock: u.stock })) },
        }
      );
    } catch {
      // Fallback: sequential update via city pricing
      for (const item of updates) {
        await apiFetch<ProductDetailResponse>(
          `/api/partner/products/${item.productId}/city-pricing`,
          {
            method: "PUT",
            body: {
              cityId,
              price: item.price ?? 0,
              exchangeDiscount: item.exchangeDiscount ?? 0,
              stock: item.stock,
            },
          }
        );
      }
      return { updatedCount: updates.length, message: "Branch inventory updated successfully" };
    }
  },
};
