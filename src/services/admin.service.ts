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
};
