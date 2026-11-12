import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export interface BulkPricingMatrix {
  categoryId: string;
  brandId: string;
  cityId: string;
  percentage: number;
}

export interface BulkPricingRequest {
  categoryId: string;
  brandId: string;
  cityId: string;
  percentage: number;
}

export const bulkPricingService = {
  getMatrix: async (categoryId: string, brandId: string): Promise<BulkPricingMatrix[]> => {
    return apiFetch<BulkPricingMatrix[]>(
      `/api/admin/bulk-pricing?categoryId=${encodeURIComponent(categoryId)}&brandId=${encodeURIComponent(brandId)}`,
      { method: "GET" }
    );
  },

  updateMatrix: async (data: BulkPricingRequest): Promise<void> => {
    return apiFetch<void>(
      `/api/admin/bulk-pricing`,
      { 
        method: "PUT",
        body: data
      }
    );
  },
};
