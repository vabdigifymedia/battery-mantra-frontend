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
  BrandContentResponse,
  BrandContentRequest,
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
  UUID,
  EnquiryResponse,
  UpdateEnquiryStatusRequest,
  CategorySpecTemplateResponse,
  CategoryReorderRequest,
  ProductReorderRequest,
  BulkProductUpdateRequest,
  LeaveRequestResponse,
  UpdateLeaveStatusRequest,
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

export interface AdminUpdateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface AdminUpdateOrderItemRequest {
  productId: string;
  quantity: number;
  exchangeOldBattery: boolean;
}

export interface AdminUpdateOrderRequest {
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  pincode: string;
  items: AdminUpdateOrderItemRequest[];
  manualDiscount?: number;
  totalAmount: number;
  deliveryMethod: string;
  installationDate?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentMode?: string;
  engineerNotes?: string;
  selectedCity?: string;
}

export type AdminOrderItemRequest = AdminUpdateOrderItemRequest;

export interface AdminCreateOrderRequest {
  customerId: string;
  addressId?: string;
  discount?: number;
  items: AdminOrderItemRequest[];
  paymentMethod: string;
  deliveryMethod: string;
  installationDate?: string;
}

export type GatePinRole = "ADMIN" | "SUB_ADMIN";

export interface GatePinRoleStatus {
  targetRole: GatePinRole;
  configured: boolean;
  updatedAt?: string | null;
}

export interface GateConfigResponse {
  admin: GatePinRoleStatus;
  subAdmin: GatePinRoleStatus;
}

export interface UpdateGatePinRequest {
  targetRole: GatePinRole;
  newPin: string;
  currentPassword: string;
}

function normalizeGateRoleEntry(raw: any, targetRole: GatePinRole): GatePinRoleStatus {
  if (!raw) return { targetRole, configured: false, updatedAt: null };

  // Support array of role entries (top-level or wrapped in configs/roles/items)
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.configs)
    ? raw.configs
    : Array.isArray(raw?.roles)
    ? raw.roles
    : Array.isArray(raw?.items)
    ? raw.items
    : null;

  if (list) {
    const match = list.find((item: any) => {
      const r = String(item?.targetRole ?? item?.role ?? "").replace(/^ROLE_/, "").toUpperCase();
      return r === targetRole;
    });
    return normalizeGateRoleEntry(match ?? null, targetRole);
  }

  // Support keyed object shapes: { ADMIN, SUB_ADMIN } or { admin, subAdmin } or nested configs/roles
  const nested =
    raw[targetRole] ??
    raw[targetRole === "ADMIN" ? "admin" : "subAdmin"] ??
    raw[targetRole === "ADMIN" ? "superAdmin" : "sub_admin"] ??
    raw?.configs?.[targetRole] ??
    raw?.roles?.[targetRole];

  if (nested && typeof nested === "object") {
    return {
      targetRole,
      configured: Boolean(
        nested.configured ?? nested.isConfigured ?? (String(nested.status ?? "").toUpperCase() === "CONFIGURED")
      ),
      updatedAt: nested.updatedAt ?? nested.lastUpdatedAt ?? null,
    };
  }

  // Support flat entry objects or flat prefix keys (adminConfigured / subAdminConfigured)
  const isAdmin = targetRole === "ADMIN";
  const prefixKey = isAdmin ? "admin" : "subAdmin";
  if (`${prefixKey}Configured` in raw || `${prefixKey}Status` in raw) {
    return {
      targetRole,
      configured: Boolean(
        raw[`${prefixKey}Configured`] ??
          (String(raw[`${prefixKey}Status`] ?? "").toUpperCase() === "CONFIGURED")
      ),
      updatedAt: raw[`${prefixKey}UpdatedAt`] ?? null,
    };
  }

  return {
    targetRole,
    configured: Boolean(
      raw.configured ?? raw.isConfigured ?? (String(raw.status ?? "").toUpperCase() === "CONFIGURED")
    ),
    updatedAt: raw.updatedAt ?? raw.lastUpdatedAt ?? null,
  };
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
  updateCapacity: (id: string, body: CreateCapacityRequest) => 
    apiFetch<CapacityResponse>(`${endpoints.admin.capacities}/${id}`, { method: "PUT", body }),
  deleteCapacity: (id: string) => 
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
  updateCustomer: (userId: string, body: AdminUpdateCustomerRequest) =>
    apiFetch<UserResponse>(endpoints.admin.updateCustomer(userId), { method: "PUT", body }),
  deleteUser: (userId: string) =>
    apiFetch<void>(endpoints.admin.deleteUser(userId), { method: "DELETE" }),

  // Orders
  getAllOrders: () => apiFetch<OrderResponse[]>(endpoints.admin.orders, { method: "GET" }),
  createOrder: (body: AdminCreateOrderRequest) => 
    apiFetch<OrderResponse>("/api/admin/orders", { method: "POST", body }),
  updateOrder: (orderId: string, body: AdminUpdateOrderRequest) =>
    apiFetch<OrderResponse>(endpoints.admin.updateOrder(orderId), { method: "PUT", body }),
  updateOrderStatus: (orderId: UUID, body: OrderStatusUpdateRequest) => 
    apiFetch<OrderResponse>(endpoints.admin.updateOrderStatus(orderId), { method: "PATCH", body }),
  assignPartner: (orderId: string, partnerId: string) =>
    apiFetch<OrderResponse>(endpoints.admin.assignPartner(orderId, partnerId), { method: "PATCH" }),
  unassignPartner: (orderId: string) =>
    apiFetch<OrderResponse>(endpoints.admin.unassignPartner(orderId), { method: "PATCH" }),
  assignEngineer: (orderId: string, engineerId: string) =>
    apiFetch<OrderResponse>(endpoints.admin.assignEngineer(orderId, engineerId), { method: "PATCH" }),
  unassignEngineer: (orderId: string) =>
    apiFetch<OrderResponse>(endpoints.admin.unassignEngineer(orderId), { method: "PATCH" }),

  // Products
  createProduct: (body: CreateProductRequest) => 
    apiFetch<ProductDetailResponse>(endpoints.admin.products.create, { method: "POST", body }),
  updateProduct: (id: UUID, body: UpdateProductRequest) => 
    apiFetch<ProductDetailResponse>(endpoints.admin.products.update(id), { method: "PATCH", body }),
  deleteProduct: (id: UUID) => 
    apiFetch<void>(endpoints.admin.products.delete(id), { method: "DELETE" }),
  getPendingProducts: () =>
    apiFetch<ProductListResponse[]>("/api/admin/products/pending-approvals", { method: "GET" }),
  approveProduct: (id: UUID) =>
    apiFetch<ProductDetailResponse>(`/api/admin/products/${id}/approve`, { method: "PATCH" }),
  getPendingPricingRequests: () =>
    apiFetch<any[]>("/api/admin/products/pending-pricing-requests", { method: "GET" }),
  approvePricingRequest: (requestId: string) =>
    apiFetch<any>(`/api/admin/products/pricing-requests/${requestId}/approve`, { method: "PATCH" }),
  rejectPricingRequest: (requestId: string, reason?: string) =>
    apiFetch<any>(`/api/admin/products/pricing-requests/${requestId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, { method: "PATCH" }),
  reorderProducts: (body: ProductReorderRequest[]) =>
    apiFetch<void>("/api/admin/products/reorder", { method: "PUT", body }),
  bulkUpdateProducts: (body: BulkProductUpdateRequest[]) =>
    apiFetch<void>("/api/admin/products/bulk-update", { method: "PUT", body }),
  updateStock: async (id: UUID, stockQuantity: number, notes?: string) => {
    try {
      return await apiFetch<{ productId: UUID; productStock: number; message: string }>(
        `/api/admin/inventory/${id}/stock`,
        {
          method: "PATCH",
          body: { stockQuantity, notes },
        }
      );
    } catch {
      // Graceful fallback to updating product directly if dedicated inventory endpoint is not yet mounted
      return await apiFetch<ProductDetailResponse>(
        endpoints.admin.products.update(id),
        {
          method: "PATCH",
          body: { productStock: stockQuantity },
        }
      );
    }
  },
  bulkUpdateStock: async (updates: Array<{ productId: UUID; stockQuantity: number }>) => {
    try {
      return await apiFetch<{ updatedCount: number; message: string }>(
        "/api/admin/inventory/bulk-update",
        {
          method: "PUT",
          body: updates,
        }
      );
    } catch {
      // Graceful fallback to bulk update products endpoint
      return await apiFetch<void>("/api/admin/products/bulk-update", {
        method: "PUT",
        body: updates.map((u) => ({
          productId: u.productId,
          productStock: u.stockQuantity,
        })),
      });
    }
  },

  updateCityStock: async (
    productId: UUID,
    cityId: string,
    stockQuantity: number,
    existingPrice?: number,
    existingDiscount?: number
  ) => {
    try {
      return await apiFetch<{ productId: UUID; cityId: string; stock: number; message: string }>(
        `/api/admin/inventory/cities/${cityId}/products/${productId}`,
        {
          method: "PATCH",
          body: { stock: stockQuantity },
        }
      );
    } catch {
      // Graceful fallback to updating city pricing directly on product
      return await apiFetch<any>(
        `/api/partner/products/${productId}/city-pricing`,
        {
          method: "PUT",
          body: {
            cityId,
            price: existingPrice ?? 0,
            exchangeDiscount: existingDiscount ?? 0,
            stock: stockQuantity,
          },
        }
      );
    }
  },

  bulkUpdateCityStock: async (
    cityId: string,
    updates: Array<{ productId: UUID; stockQuantity: number; price?: number; exchangeDiscount?: number }>
  ) => {
    try {
      return await apiFetch<{ updatedCount: number; message: string }>(
        `/api/admin/inventory/cities/${cityId}/bulk-update`,
        {
          method: "PUT",
          body: updates.map((u) => ({ productId: u.productId, stock: u.stockQuantity })),
        }
      );
    } catch {
      // Fallback: sequential update
      for (const item of updates) {
        await apiFetch<any>(
          `/api/partner/products/${item.productId}/city-pricing`,
          {
            method: "PUT",
            body: {
              cityId,
              price: item.price ?? 0,
              exchangeDiscount: item.exchangeDiscount ?? 0,
              stock: item.stockQuantity,
            },
          }
        );
      }
      return { updatedCount: updates.length, message: "City inventory updated successfully" };
    }
  },

  // Categories
  createCategory: (body: CreateCategoryRequest) => 
    apiFetch<CategoryDetailResponse>(endpoints.admin.categories.create, { method: "POST", body }),
  updateCategory: (id: UUID, body: UpdateCategoryRequest) => 
    apiFetch<CategoryDetailResponse>(endpoints.admin.categories.update(id), { method: "PATCH", body }),
  deleteCategory: (id: UUID) => 
    apiFetch<void>(endpoints.admin.categories.delete(id), { method: "DELETE" }),
  reorderCategories: (body: CategoryReorderRequest[]) =>
    apiFetch<void>("/api/admin/categories/reorder", { method: "PUT", body }),

  // Brands
  createBrand: (body: BrandRequest) => 
    apiFetch<BrandResponse>(endpoints.admin.brands.create, { method: "POST", body }),
  updateBrand: (id: UUID, body: BrandRequest) => 
    apiFetch<BrandResponse>(endpoints.admin.brands.update(id), { method: "PUT", body }),
  deleteBrand: (id: UUID) => 
    apiFetch<void>(endpoints.admin.brands.delete(id), { method: "DELETE" }),

  // Brand Contents (Category + Brand Specific)
  getAllBrandContents: () =>
    apiFetch<BrandContentResponse[]>(endpoints.admin.brandContents.list),
  findBrandContent: async (categoryId: string, brandId: string) => {
    try {
      return await apiFetch<BrandContentResponse | null>(endpoints.admin.brandContents.find(categoryId, brandId));
    } catch (e: any) {
      if (e?.status === 404 || e?.status === 204) return null;
      throw e;
    }
  },
  saveBrandContent: (body: BrandContentRequest) =>
    apiFetch<BrandContentResponse>(endpoints.admin.brandContents.save, { method: "POST", body }),

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

  // Enquiries
  getAllEnquiries: (type?: string) =>
    apiFetch<EnquiryResponse[]>(endpoints.admin.enquiries.list(type), { method: "GET" }),
  updateEnquiryStatus: (id: string, body: UpdateEnquiryStatusRequest) =>
    apiFetch<EnquiryResponse>(endpoints.admin.enquiries.updateStatus(id), { method: "PATCH", body }),

  // Leaves
  getAllLeaveRequests: () =>
    apiFetch<LeaveRequestResponse[]>("/api/admin/leaves", { method: "GET" }),
  updateLeaveStatus: (id: string, body: UpdateLeaveStatusRequest) =>
    apiFetch<LeaveRequestResponse>(`/api/admin/leaves/${id}/status`, { method: "PUT", body }),

  getCategorySpecTemplate: (categoryId: string) =>
    apiFetch<CategorySpecTemplateResponse>(`/api/admin/specs/template/category/${categoryId}`, { method: "GET" }),

  // Security / Mobile App Gate PINs (ROLE_ADMIN only)
  getGateConfig: async (): Promise<GateConfigResponse> => {
    const raw = await apiFetch<any>(endpoints.admin.security.gateConfig, { method: "GET" });
    return {
      admin: normalizeGateRoleEntry(raw, "ADMIN"),
      subAdmin: normalizeGateRoleEntry(raw, "SUB_ADMIN"),
    };
  },
  updateGatePin: (body: UpdateGatePinRequest) =>
    apiFetch<{ message?: string }>(endpoints.admin.security.gatePin, {
      method: "PUT",
      body,
    }),
};
