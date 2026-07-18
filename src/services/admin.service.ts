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
  UUID
} from "@/types/dto";

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

  // Users
  getAllUsers: () => apiFetch<UserResponse[]>(endpoints.admin.users, { method: "GET" }),

  // Orders
  getAllOrders: () => apiFetch<OrderResponse[]>(endpoints.admin.orders, { method: "GET" }),
  updateOrderStatus: (orderId: UUID, body: OrderStatusUpdateRequest) => 
    apiFetch<OrderResponse>(endpoints.admin.updateOrderStatus(orderId), { method: "PATCH", body }),

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
