import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { 
  CouponRequest, 
  CouponResponse, 
  ApplyCouponRequest, 
  ApplyCouponResponse 
} from "@/types/dto";
import { enrichCouponWithTargeting, persistCouponTargeting } from "@/lib/coupon-rules";

// Local cache for public display
const PUBLIC_COUPONS_KEY = "bm_public_active_coupons_cache";

function cachePublicCoupons(coupons: CouponResponse[]) {
  if (typeof window === "undefined") return;
  try {
    const active = coupons.filter((c) => c.isActive);
    localStorage.setItem(PUBLIC_COUPONS_KEY, JSON.stringify(active));
  } catch {
    // Ignore
  }
}

function getCachedPublicCoupons(): CouponResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PUBLIC_COUPONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const couponsService = {
  // Public Endpoint: Apply coupon at checkout
  applyCoupon: async (req: ApplyCouponRequest): Promise<ApplyCouponResponse> => {
    return apiFetch<ApplyCouponResponse>(endpoints.coupons.apply, {
      method: "POST",
      body: req,
    });
  },

  // Public: Get active coupons for PDP display (without campaign)
  getActivePublicCoupons: async (): Promise<CouponResponse[]> => {
    try {
      // 1. Try fetching from public/admin endpoint
      const list = await apiFetch<CouponResponse[]>(endpoints.admin.coupons.list, {
        method: "GET",
      });
      if (Array.isArray(list)) {
        const enriched = list.map(enrichCouponWithTargeting).filter((c) => c.isActive);
        cachePublicCoupons(enriched);
        return enriched;
      }
    } catch {
      // Fallback to cached active coupons
    }

    const cached = getCachedPublicCoupons();
    return cached.map(enrichCouponWithTargeting).filter((c) => c.isActive);
  },

  // Admin Endpoints
  getAllAdminCoupons: async (): Promise<CouponResponse[]> => {
    const list = await apiFetch<CouponResponse[]>(endpoints.admin.coupons.list, {
      method: "GET",
    });
    const enriched = (list || []).map(enrichCouponWithTargeting);
    cachePublicCoupons(enriched);
    return enriched;
  },

  createCoupon: async (req: CouponRequest): Promise<CouponResponse> => {
    // Always persist targeting locally
    persistCouponTargeting(req.code, req);

    try {
      const created = await apiFetch<CouponResponse>(endpoints.admin.coupons.create, {
        method: "POST",
        body: req,
      });
      return enrichCouponWithTargeting(created);
    } catch (err: any) {
      // If backend throws 400 due to unrecognized targeting properties
      if (
        err?.status === 400 &&
        (err?.message?.includes("Unrecognized") || err?.message?.includes("targetType"))
      ) {
        const {
          targetType,
          targetCategoryIds,
          targetCategoryNames,
          targetBrandIds,
          targetBrandNames,
          targetProductIds,
          excludedProductIds,
          displayOnPdp,
          pdpHighlightText,
          ...corePayload
        } = req;
        const created = await apiFetch<CouponResponse>(endpoints.admin.coupons.create, {
          method: "POST",
          body: corePayload,
        });
        return enrichCouponWithTargeting(created);
      }
      throw err;
    }
  },

  updateCoupon: async (id: string, req: CouponRequest): Promise<CouponResponse> => {
    persistCouponTargeting(req.code, req);

    try {
      const updated = await apiFetch<CouponResponse>(endpoints.admin.coupons.byId(id), {
        method: "PUT",
        body: req,
      });
      return enrichCouponWithTargeting(updated);
    } catch (err: any) {
      if (
        err?.status === 400 &&
        (err?.message?.includes("Unrecognized") || err?.message?.includes("targetType"))
      ) {
        const {
          targetType,
          targetCategoryIds,
          targetCategoryNames,
          targetBrandIds,
          targetBrandNames,
          targetProductIds,
          excludedProductIds,
          displayOnPdp,
          pdpHighlightText,
          ...corePayload
        } = req;
        const updated = await apiFetch<CouponResponse>(endpoints.admin.coupons.byId(id), {
          method: "PUT",
          body: corePayload,
        });
        return enrichCouponWithTargeting(updated);
      }
      throw err;
    }
  },

  deleteCoupon: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(endpoints.admin.coupons.byId(id), {
      method: "DELETE",
    });
  },
};
