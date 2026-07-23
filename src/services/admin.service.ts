import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { 
  UserResponse, 
  OrderResponse, 
  OrderStatusUpdateRequest,
  CreateProductRequest,
  UpdateProductRequest,
  ProductDetailResponse,
  ProductListResponse,
  CategoryDetailResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  BrandResponse,
  BrandRequest,
  BannerResponse,
  CreateBannerRequest,
  UpdateBannerRequest,
  VehicleResponse,
  CreateVehicleRequest,
  CallbackResponse,
  UpdateCallbackStatusRequest,
  CapacityResponse,
  CreateCapacityRequest,
  FuelResponse,
  CreateFuelRequest,
  UUID
} from "@/types/dto";

export interface AdminCreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AdminOrderItemRequest {
  productId: string;
  quantity: number;
  exchangeOldBattery: boolean;
}

export interface AdminCreateOrderRequest {
  customerId: string;
  addressId?: string;
  discount?: number;
  items: AdminOrderItemRequest[];
  paymentMethod: string;
  deliveryMethod: string;
  installationDate?: string;
}

export const adminService = {
  // Upload
  uploadImage: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ url: string; publicId: string }>(endpoints.admin.upload, {
      method: "POST",
      query: { folder },
      body: formData,
      multipart: true,
    });
  },

  // Capacities
  getAllCapacities: (categoryId?: string) => 
    apiFetch<CapacityResponse[]>(categoryId ? `${endpoints.vehicles.capacities}?categoryId=${categoryId}` : endpoints.vehicles.capacities, { method: "GET" }),
  createCapacity: (body: CreateCapacityRequest) => 
    apiFetch<CapacityResponse>(endpoints.admin.capacities, { method: "POST", body }),
  updateCapacity: (id: UUID, body: CreateCapacityRequest) => 
    apiFetch<CapacityResponse>(`${endpoints.admin.capacities}/${id}`, { method: "PUT", body }),
  deleteCapacity: (id: UUID) => 
    apiFetch<void>(`${endpoints.admin.capacities}/${id}`, { method: "DELETE" }),

  // Fuels
  getAllFuels: () => 
    apiFetch<FuelResponse[]>(endpoints.admin.fuels, { method: "GET" }),
  createFuel: (body: CreateFuelRequest) => 
    apiFetch<FuelResponse>(endpoints.admin.fuels, { method: "POST", body }),
  updateFuel: (id: UUID, body: CreateFuelRequest) => 
    apiFetch<FuelResponse>(`${endpoints.admin.fuels}/${id}`, { method: "PUT", body }),
  deleteFuel: (id: UUID) => 
    apiFetch<void>(`${endpoints.admin.fuels}/${id}`, { method: "DELETE" }),

  // Users & Customers
  getAllUsers: () => apiFetch<UserResponse[]>(endpoints.admin.users, { method: "GET" }),
  createCustomer: (body: AdminCreateCustomerRequest) => 
    apiFetch<UserResponse>("/api/admin/customers", { method: "POST", body }),

  // Orders
  getAllOrders: () => apiFetch<OrderResponse[]>(endpoints.admin.orders, { method: "GET" }),
  createOrder: (body: AdminCreateOrderRequest) => 
    apiFetch<OrderResponse>("/api/admin/orders", { method: "POST", body }),
  updateOrderStatus: (orderId: UUID, body: OrderStatusUpdateRequest) => 
    apiFetch<OrderResponse>(endpoints.admin.updateOrderStatus(orderId), { method: "PATCH", body }),
  assignPartner: (orderId: string, partnerId: string) =>
    apiFetch<OrderResponse>(endpoints.admin.assignPartner(orderId, partnerId), { method: "PATCH" }),
  assignEngineer: (orderId: string, engineerId: string) =>
    apiFetch<OrderResponse>(`/api/admin/orders/${orderId}/assign-engineer?engineerId=${engineerId}`, { method: "PATCH" }),

  // Products
  createProduct: (body: CreateProductRequest) => 
    apiFetch<ProductDetailResponse>(endpoints.admin.products.create, { method: "POST", body }),
  updateProduct: (id: UUID, body: UpdateProductRequest) => 
    apiFetch<ProductDetailResponse>(endpoints.admin.products.update(id), { method: "PATCH", body }),
  deleteProduct: (id: UUID) => 
    apiFetch<void>(endpoints.admin.products.delete(id), { method: "DELETE" }),

  // Categories
  createCategory: (body: CreateCategoryRequest) => 
    apiFetch<CategoryDetailResponse>(endpoints.admin.categories.create, { method: "POST", body }),
  updateCategory: (id: UUID, body: UpdateCategoryRequest) => 
    apiFetch<CategoryDetailResponse>(endpoints.admin.categories.update(id), { method: "PATCH", body }),
  deleteCategory: (id: UUID) => 
    apiFetch<void>(endpoints.admin.categories.delete(id), { method: "DELETE" }),

  // Brands
  createBrand: (body: BrandRequest) => 
    apiFetch<BrandResponse>(endpoints.admin.brands.create, { method: "POST", body }),
  updateBrand: (id: UUID, body: BrandRequest) => 
    apiFetch<BrandResponse>(endpoints.admin.brands.update(id), { method: "PUT", body }),
  deleteBrand: (id: UUID) => 
    apiFetch<void>(endpoints.admin.brands.delete(id), { method: "DELETE" }),

  // Vehicles
  createVehicle: (body: CreateVehicleRequest) => 
    apiFetch<VehicleResponse>(endpoints.admin.vehicles.create, { method: "POST", body }),
  updateVehicle: (id: string, data: CreateVehicleRequest) => 
    apiFetch<VehicleResponse>(endpoints.admin.vehicles.update(id), { method: "PUT", body: data }),
  deleteVehicle: (id: string) => 
    apiFetch<void>(endpoints.admin.vehicles.delete(id), { method: "DELETE" }),

  // Callbacks
  getAllCallbacks: () =>
    apiFetch<CallbackResponse[]>(endpoints.admin.callbacks.list, { method: "GET" }),
  updateCallbackStatus: (id: string, body: UpdateCallbackStatusRequest) =>
    apiFetch<CallbackResponse>(endpoints.admin.callbacks.updateStatus(id), { method: "PATCH", body }),

  // Banners
  getAllBanners: () => apiFetch<BannerResponse[]>(endpoints.admin.banners.list, { method: "GET" }),
  createBanner: (data: CreateBannerRequest) => 
    apiFetch<BannerResponse>(endpoints.admin.banners.create, { method: "POST", body: data }),
  updateBanner: (id: string, data: UpdateBannerRequest) => 
    apiFetch<BannerResponse>(endpoints.admin.banners.update(id), { method: "PUT", body: data }),
  deleteBanner: (id: string) => 
    apiFetch<void>(endpoints.admin.banners.delete(id), { method: "DELETE" }),
};
