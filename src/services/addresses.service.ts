import { api } from "@/lib/api/client";
import { endpoints } from "@/constants/endpoints";
import type { AddressRequest, AddressResponse } from "@/types/dto";

export const addressesService = {
  list: async (signal?: AbortSignal) => {
    return api.get<AddressResponse[]>(endpoints.addresses.list, { signal });
  },

  add: async (data: AddressRequest) => {
    return api.post<AddressResponse>(endpoints.addresses.add, data);
  },

  update: async (addressId: string, data: AddressRequest) => {
    return api.put<AddressResponse>(endpoints.addresses.update(addressId), data);
  },

  delete: async (addressId: string) => {
    return api.delete<void>(endpoints.addresses.delete(addressId));
  },
};
