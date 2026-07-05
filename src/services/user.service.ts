import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { UserProfileResponse, UpdateProfileRequest, UpdatePasswordRequest } from "@/types/dto";

export const userService = {
  getProfile: async (signal?: AbortSignal) => {
    return apiFetch<UserProfileResponse>(endpoints.user.profile, { signal });
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    return apiFetch<UserProfileResponse>(endpoints.user.profile, { method: "PUT", body: data });
  },

  updatePassword: async (data: UpdatePasswordRequest) => {
    return apiFetch<void>(endpoints.user.password, { method: "PUT", body: data });
  },
};
