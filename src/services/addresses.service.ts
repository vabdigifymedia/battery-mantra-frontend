import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AddressRequest, AddressResponse } from "@/types/dto";

export const addressesService = {
  list: async (signal?: AbortSignal) => {
    return apiFetch<AddressResponse[]>(endpoints.addresses.list, { signal });
  },

  add: async (data: AddressRequest) => {
    return apiFetch<AddressResponse>(endpoints.addresses.add, { method: "POST", body: data });
  },

  update: async (addressId: string, data: AddressRequest) => {
    return apiFetch<AddressResponse>(endpoints.addresses.update(addressId), { method: "PUT", body: data });
  },

  delete: async (addressId: string) => {
    return apiFetch<void>(endpoints.addresses.delete(addressId), { method: "DELETE" });
  },
};
