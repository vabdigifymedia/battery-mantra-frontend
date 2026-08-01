import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { 
  CouponRequest, 
  CouponResponse, 
  ApplyCouponRequest, 
  ApplyCouponResponse 
} from "@/types/dto";

export const couponsService = {
  // Public Endpoint
  applyCoupon: async (req: ApplyCouponRequest): Promise<ApplyCouponResponse> => {
    return apiFetch<ApplyCouponResponse>(endpoints.coupons.apply, {
      method: "POST",
      body: req,
    });
  },

  // Admin Endpoints
  getAllAdminCoupons: async (): Promise<CouponResponse[]> => {
    return apiFetch<CouponResponse[]>(endpoints.admin.coupons.list, {
      method: "GET",
    });
  },

  createCoupon: async (req: CouponRequest): Promise<CouponResponse> => {
    return apiFetch<CouponResponse>(endpoints.admin.coupons.create, {
      method: "POST",
      body: req,
    });
  },

  updateCoupon: async (id: string, req: CouponRequest): Promise<CouponResponse> => {
    return apiFetch<CouponResponse>(endpoints.admin.coupons.byId(id), {
      method: "PUT",
      body: req,
    });
  },

  deleteCoupon: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(endpoints.admin.coupons.byId(id), {
      method: "DELETE",
    });
  },
};
