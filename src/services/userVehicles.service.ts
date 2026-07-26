import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { UserVehicleRequest, UserVehicleResponse } from "@/types/dto";

export const userVehiclesService = {
  list: async (signal?: AbortSignal) => {
    return apiFetch<UserVehicleResponse[]>(endpoints.user.vehicles.list, { signal });
  },

  add: async (data: UserVehicleRequest) => {
    return apiFetch<UserVehicleResponse>(endpoints.user.vehicles.add, { method: "POST", body: data });
  },

  delete: async (vehicleId: string) => {
    return apiFetch<void>(endpoints.user.vehicles.delete(vehicleId), { method: "DELETE" });
  },
};
