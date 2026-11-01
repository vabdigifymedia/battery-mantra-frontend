import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignDetailWithProductsResponse,
  CartValidationRequest,
  CartValidationResponse,
} from "@/types/dto";

export const campaignService = {
  // Public / Storefront Endpoints
  getActiveCampaigns: async (signal?: AbortSignal): Promise<CampaignResponse[]> => {
    try {
      const res = await apiFetch<any>(endpoints.campaigns.active, {
        method: "GET",
        auth: false,
        signal,
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.content)) return res.content;
      return [];
    } catch (e) {
      console.warn("Could not fetch active campaigns:", e);
      return [];
    }
  },

  getCampaignBySlug: async (
    slug: string,
    params?: { page?: number; size?: number; category?: string; brand?: string; sort?: string },
    signal?: AbortSignal
  ): Promise<CampaignDetailWithProductsResponse> => {
    return apiFetch<CampaignDetailWithProductsResponse>(endpoints.campaigns.bySlug(slug, params), {
      method: "GET",
      auth: false,
      signal,
    });
  },

  validateCart: async (req: CartValidationRequest): Promise<CartValidationResponse> => {
    return apiFetch<CartValidationResponse>(endpoints.campaigns.validateCart, {
      method: "POST",
      body: req,
      auth: false,
    });
  },

  // Admin Endpoints
  getAllAdminCampaigns: async (status?: string): Promise<CampaignResponse[]> => {
    try {
      const res = await apiFetch<any>(endpoints.admin.campaigns.list(status), {
        method: "GET",
        auth: true,
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.content)) return res.content;
      return [];
    } catch (e) {
      console.warn("Could not fetch admin campaigns:", e);
      return [];
    }
  },

  getAdminCampaignById: async (id: string): Promise<CampaignResponse> => {
    return apiFetch<CampaignResponse>(endpoints.admin.campaigns.byId(id), {
      method: "GET",
      auth: true,
    });
  },

  createCampaign: async (req: CreateCampaignRequest): Promise<CampaignResponse> => {
    return apiFetch<CampaignResponse>(endpoints.admin.campaigns.create, {
      method: "POST",
      body: req,
      auth: true,
    });
  },

  updateCampaign: async (id: string, req: UpdateCampaignRequest): Promise<CampaignResponse> => {
    return apiFetch<CampaignResponse>(endpoints.admin.campaigns.byId(id), {
      method: "PUT",
      body: req,
      auth: true,
    });
  },

  deleteCampaign: async (id: string): Promise<{ message?: string }> => {
    return apiFetch<{ message?: string }>(endpoints.admin.campaigns.byId(id), {
      method: "DELETE",
      auth: true,
    });
  },

  toggleCampaignStatus: async (id: string): Promise<CampaignResponse> => {
    return apiFetch<CampaignResponse>(endpoints.admin.campaigns.toggleStatus(id), {
      method: "PATCH",
      auth: true,
    });
  },
};
