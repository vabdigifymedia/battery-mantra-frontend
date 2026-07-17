import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ManufacturerResponse, CreateManufacturerRequest, UpdateManufacturerRequest } from "@/types/dto";

export const manufacturersService = {
  list: (signal?: AbortSignal) =>
    apiFetch<ManufacturerResponse[]>(endpoints.manufacturers.list, { signal, auth: false }),
  create: (data: CreateManufacturerRequest, signal?: AbortSignal) =>
    apiFetch<ManufacturerResponse>(endpoints.admin.manufacturers.create, {
      method: "POST",
      body: data,
      signal,
    }),
  update: (id: string, data: UpdateManufacturerRequest, signal?: AbortSignal) =>
    apiFetch<ManufacturerResponse>(endpoints.admin.manufacturers.update(id), {
      method: "PUT",
      body: data,
      signal,
    }),
  delete: (id: string, signal?: AbortSignal) =>
    apiFetch<void>(endpoints.admin.manufacturers.delete(id), {
      method: "DELETE",
      signal,
    }),
};
