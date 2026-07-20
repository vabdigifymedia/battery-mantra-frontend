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
      `${endpoints.admin.base}/bulk-pricing?categoryId=${categoryId}&brandId=${brandId}`,
      { method: "GET" }
    );
  },

  updateMatrix: async (data: BulkPricingRequest): Promise<BulkPricingMatrix> => {
    return apiFetch<BulkPricingMatrix>(
      `${endpoints.admin.base}/bulk-pricing`,
      { 
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
  },
};
