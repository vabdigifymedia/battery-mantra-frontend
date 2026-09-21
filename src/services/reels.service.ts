import { apiFetch } from "@/lib/api/client";
import type { ReelResponse, CreateReelRequest, UpdateReelRequest } from "@/types/dto";

export const reelsService = {
  active: async (signal?: AbortSignal) => {
    return apiFetch<ReelResponse[]>("/api/reels/active", { method: "GET", signal });
  },

  getAll: async () => {
    return apiFetch<ReelResponse[]>("/api/admin/reels", { method: "GET" });
  },

  create: async (body: CreateReelRequest) => {
    return apiFetch<ReelResponse>("/api/admin/reels", { method: "POST", body });
  },

  update: async (id: string, body: UpdateReelRequest) => {
    return apiFetch<ReelResponse>(`/api/admin/reels/id/${id}`, { method: "PUT", body });
  },

  delete: async (id: string) => {
    return apiFetch<void>(`/api/admin/reels/id/${id}`, { method: "DELETE" });
  },
};
