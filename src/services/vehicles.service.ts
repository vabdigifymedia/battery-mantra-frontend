import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { VehicleResponse } from "@/types/dto";

export const vehiclesService = {
  list: (signal?: AbortSignal) =>
    apiFetch<VehicleResponse[]>(endpoints.vehicles.list, { signal, auth: false }),
  search: (params: { make?: string; model?: string }, signal?: AbortSignal) =>
    apiFetch<VehicleResponse[]>(endpoints.vehicles.search, {
      query: params,
      signal,
      auth: false,
    }),
  byId: (id: string, signal?: AbortSignal) =>
    apiFetch<VehicleResponse>(endpoints.vehicles.byId(id), { signal, auth: false }),
};
