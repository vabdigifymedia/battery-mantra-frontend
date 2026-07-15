import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  CityDto,
  CreateCityRequest,
  UpdateCityRequest,
  PincodeDto,
  AddPincodeRequest,
} from "@/types/dto";

export const locationService = {
  // Cities
  getAllCities: () => 
    apiFetch<CityDto[]>(endpoints.admin.locations.cities.list),
  
  createCity: (data: CreateCityRequest) =>
    apiFetch<CityDto>(endpoints.admin.locations.cities.create, { method: "POST", body: data }),
    
  updateCity: (id: string, data: UpdateCityRequest) =>
    apiFetch<CityDto>(endpoints.admin.locations.cities.update(id), { method: "PUT", body: data }),
    
  deleteCity: (id: string) =>
    apiFetch<void>(endpoints.admin.locations.cities.delete(id), { method: "DELETE" }),

  // Pincodes
  getPincodesForCity: (cityId: string) =>
    apiFetch<PincodeDto[]>(endpoints.admin.locations.pincodes.list(cityId)),
    
  addPincodesToCity: (cityId: string, data: AddPincodeRequest) =>
    apiFetch<PincodeDto[]>(endpoints.admin.locations.pincodes.add(cityId), { method: "POST", body: data }),
    
  deletePincode: (pincodeId: string) =>
    apiFetch<void>(endpoints.admin.locations.pincodes.delete(pincodeId), { method: "DELETE" }),
};
