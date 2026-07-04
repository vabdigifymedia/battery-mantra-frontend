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
  VehicleResponse,
  CreateVehicleRequest,
  UUID
} from "@/types/dto";

export const adminService = {
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
  updateVehicle: (id: UUID, body: CreateVehicleRequest) => 
    apiFetch<VehicleResponse>(endpoints.admin.vehicles.update(id), { method: "PUT", body }),
  deleteVehicle: (id: UUID) => 
    apiFetch<void>(endpoints.admin.vehicles.delete(id), { method: "DELETE" }),
};
