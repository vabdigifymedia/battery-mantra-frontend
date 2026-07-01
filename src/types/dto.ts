/**
 * DTOs mapped 1:1 from the Battery Mantra OpenAPI spec (v1.0).
 * Field names match the backend exactly — do not rename.
 */

export type UUID = string;

/* ---------- Auth ---------- */
export type LoginRequest = { username: string; password: string };
export type LoginResponse = { token: string; id: UUID };

export type RegisterRole = "ADMIN" | "CUSTOMER";
export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: RegisterRole;
};
export type RegisterResponse = {
  id: UUID;
  username: string;
  email: string;
  phoneNumber: string;
  role: RegisterRole;
};

/* ---------- Vehicles ---------- */
export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC" | "CNG";
export type VehicleResponse = {
  vehicleId: UUID;
  make: string;
  model: string;
  yearFrom?: number;
  yearTo?: number;
  fuelType?: FuelType;
};
export type CreateVehicleRequest = {
  make: string;
  model: string;
  yearFrom?: number;
  yearTo?: number;
  fuelType?: FuelType;
};

/* ---------- Brands ---------- */
export type BrandResponse = {
  brandId: UUID;
  brandName: string;
  brandLogo?: string;
  featured?: boolean;
};
export type BrandRequest = {
  brandName: string;
  brandLogo?: string;
  featured?: boolean;
};

/* ---------- Categories ---------- */
export type CategoryListResponse = {
  categoryId: UUID;
  categoryName: string;
  categoryDescription?: string;
  iconUrl?: string;
  displayOrder?: number;
};
export type CategoryDetailResponse = CategoryListResponse & {
  parentId?: UUID;
  children?: CategoryListResponse[];
};

/* ---------- Products ---------- */
export type ProductListResponse = {
  productId: UUID;
  productName: string;
  brandName?: string;
  productPrice: number;
  productImage?: string;
  productCategory?: string;
};

export type ProductDetailResponse = {
  productId: UUID;
  productName: string;
  productDescription?: string;
  brandName?: string;
  brandId?: UUID;
  categoryName?: string;
  categoryId?: UUID;
  productPrice: number;
  productStock?: number;
  productImage?: string;
  specs?: Record<string, unknown>;
  compatibleVehicles?: VehicleResponse[];
};

export type PageProductListResponse = {
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  content: ProductListResponse[];
};

export type ProductFilterParams = {
  categoryId?: UUID;
  brandId?: UUID;
  vehicleId?: UUID;
  minPrice?: number;
  maxPrice?: number;
  specKey?: string;
  specValue?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

/* ---------- Cart ---------- */
export type AddToCartRequest = { productId: UUID; quantity: number };
export type UpdateCartItemRequest = { quantity: number };
export type CartItemResponse = {
  cartItemId: UUID;
  product: ProductListResponse;
  quantity: number;
};
export type CartResponse = {
  cartId: UUID;
  userId: UUID;
  cartItems: CartItemResponse[];
};

/* ---------- Orders ---------- */
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type CheckoutRequest = { addressId: UUID };
export type OrderItemResponse = {
  productId: UUID;
  productName: string;
  productImage?: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
};
export type OrderResponse = {
  orderId: UUID;
  orderStatus: OrderStatus | string;
  shippingAddress?: string;
  placedAt: string;
  totalAmount: number;
  orderItems: OrderItemResponse[];
};

/* ---------- Admin ---------- */
export type UserResponse = {
  userId: UUID;
  name?: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  role: RegisterRole | string;
  createdAt?: string;
};

export type CreateProductRequest = {
  productName: string;
  productDescription?: string;
  productStock?: number;
  productPrice: number;
  productImage?: string;
  categoryId?: UUID;
  brandId?: UUID;
  specs?: Record<string, unknown>;
  compatibleVehicleIds?: UUID[];
};

export type UpdateProductRequest = Partial<CreateProductRequest>;

export type OrderStatusUpdateRequest = {
  orderStatus: OrderStatus;
};
