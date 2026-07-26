/**
 * DTOs mapped 1:1 from the Battery Mantra OpenAPI spec (v1.0).
 * Field names match the backend exactly — do not rename.
 */

export type UUID = string;

/* ---------- Auth ---------- */
export type LoginRequest = { username: string; password: string };
export type LoginResponse = { 
  token: string;
  refreshToken: string; 
  id: UUID;
  role: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  token: string;
  refreshToken: string;
};

export type SendOtpRequest = {
  phoneNumber: string;
};

export type VerifyOtpRequest = {
  phoneNumber: string;
  otp: string;
};

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

/* ---------- Manufacturers ---------- */
export type ManufacturerResponse = {
  id: UUID;
  name: string;
  logoUrl?: string;
  displayOrder?: number;
  categories?: { categoryId: UUID; categoryName: string }[];
};
export type CreateManufacturerRequest = {
  name: string;
  logoUrl?: string;
  displayOrder?: number;
  categoryIds?: string[];
};
export type UpdateManufacturerRequest = Partial<CreateManufacturerRequest>;

export type FuelResponse = {
  fuelId: UUID;
  fuelName: string;
  displayOrder?: number;
};
export type CreateFuelRequest = {
  fuelName: string;
  displayOrder?: number;
};

export type VehicleType = "CAR" | "BIKE" | "COMMERCIAL" | "E_RICKSHAW" | "INVERTER";

export type VehicleResponse = {
  vehicleId: UUID;
  vehicleType: VehicleType;
  make: string;
  model: string;
  fuelId?: UUID;
  fuelName?: string;
  imageUrl?: string | null;
  capacity?: string;
  categoryId?: UUID;
  manufacturerId?: UUID;
  description?: string;
};
export type CreateVehicleRequest = {
  vehicleType: VehicleType;
  make: string;
  model: string;
  fuelId?: UUID;
  imageUrl?: string;
  capacity?: string;
  categoryId?: UUID;
  manufacturerId?: UUID;
  description?: string;
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

/* ---------- Banners ---------- */
export type BannerResponse = {
  bannerId: UUID;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
};
export type CreateBannerRequest = {
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
};
export type UpdateBannerRequest = Partial<CreateBannerRequest>;

/* ---------- Categories ---------- */
export type CategoryListResponse = {
  categoryId: UUID;
  categoryName: string;
  categorySlug?: string;
  categoryDescription?: string;
  iconUrl?: string;
  displayOrder?: number;
  parentId?: UUID | null;
  subCategories?: CategoryListResponse[];
};
export type CategoryDetailResponse = CategoryListResponse & {
  parentId?: UUID;
  children?: CategoryListResponse[];
};
export type CreateCategoryRequest = {
  categoryName: string;
  categoryDescription?: string;
  iconUrl?: string;
  displayOrder?: number;
  parentId?: UUID;
};
export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

/* ---------- Products ---------- */
export type ProductListResponse = {
  productId: UUID;
  productName: string;
  brandName?: string;
  productPrice: number;
  exchangeDiscount?: number;
  productImage?: string;
  additionalImages?: string[];
  productCategory?: string;
  capacity?: string;
  isAutoAssignToPartner?: boolean;
  isApproved?: boolean;
  createdByPartnerId?: UUID;
  partnerBusinessName?: string;
  seo?: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    [key: string]: unknown;
  };
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
  exchangeDiscount?: number;
  productStock?: number;
  productImage?: string;
  additionalImages?: string[];
  capacity?: string;
  specs?: Record<string, unknown>;
  compatibleVehicles?: VehicleResponse[];
  cityPrices?: CityPricingDto[];
  isApproved?: boolean;
  isAutoAssignToPartner?: boolean;
  createdByPartnerId?: UUID;
  partnerBusinessName?: string;
  seo?: Record<string, unknown>;
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
  capacity?: string;
  specKey?: string;
  specValue?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

/* ---------- Cart ---------- */
export type AddToCartRequest = { 
  productId: UUID; 
  quantity: number;
  exchangeOldBattery?: boolean;
};
export type UpdateCartItemRequest = { quantity: number };

export type CartItemResponse = {
  cartItemId: UUID;
  product: ProductListResponse;
  quantity: number;
  subtotal: number;
  exchangeOldBattery?: boolean;
};

export type CartResponse = {
  cartId: UUID;
  userId: UUID;
  cartItems: CartItemResponse[];
  subTotal: number;
  exchangeDiscount: number;
  totalAmount: number;
};

/* ---------- Orders ---------- */
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "INSTALLED"
  | "CANCELLED";
export type CheckoutRequest = {
  addressId: UUID;
  deliveryMethod: string;
  installationDate?: string;
};
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
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  placedAt: string;
  totalAmount: number;
  deliveryMethod?: string;
  paymentMethod?: string;
  installationDate?: string;
  exchangeDiscount?: number;
  orderItems: OrderItemResponse[];
};

/* ---------- Capacities (Battery RL) ---------- */
export type CapacityResponse = {
  capacityId: UUID;
  categoryId: UUID;
  capacityName: string;
};

export type CreateCapacityRequest = {
  categoryId: UUID;
  capacityName: string;
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

export type CityPricingDto = {
  cityId: UUID;
  price: number;
  exchangeDiscount?: number;
  stock: number;
};

export type CreateProductRequest = {
  productName: string;
  productDescription?: string;
  productStock?: number;
  productPrice: number;
  exchangeDiscount?: number;
  productImage?: string;
  categoryId?: UUID;
  brandId?: UUID;
  specs?: Record<string, unknown>;
  capacity?: string;
  cityPrices?: CityPricingDto[];
};

export type UpdateProductRequest = Partial<CreateProductRequest>;

export type OrderStatusUpdateRequest = {
  orderStatus: OrderStatus;
};

/* ---------- Addresses ---------- */
export type AddressRequest = {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type AddressResponse = AddressRequest & {
  addressId: UUID;
};

/* ---------- User Profile ---------- */
export type UserProfileResponse = {
  username: string;
  email: string;
  phoneNumber: string;
};

export type UpdateProfileRequest = {
  email: string;
  phoneNumber: string;
};

export type UpdatePasswordRequest = {
  currentPassword?: string;
  newPassword?: string;
};

export type CallbackStatus = "PENDING" | "RESOLVED";

export interface CallbackResponse {
  callbackId: number;
  mobileNumber: string;
  status: CallbackStatus;
  createdAt: string;
}

export interface CreateCallbackRequest {
  mobileNumber: string;
}

export interface UpdateCallbackStatusRequest {
  status: CallbackStatus;
}

/* ---------- Enquiries ---------- */
export interface CreateQuotationRequest {
  name: string;
  mobileNumber: string;
  email?: string;
  quantity: string;
  message?: string;
  productId?: string;
  productName?: string;
}

export interface CreateCorporateEnquiryRequest {
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  email?: string;
  gstin?: string;
  estimatedQty: string;
  notes?: string;
  productId?: string;
  productName?: string;
}

export type EnquiryType = "QUOTATION" | "CORPORATE" | "CALLBACK";
export type EnquiryStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";

export interface EnquiryResponse {
  id: number;
  enquiryType: EnquiryType;
  status: EnquiryStatus;
  
  // Quotation specific
  name?: string;
  quantity?: string;
  message?: string;
  
  // Corporate specific
  companyName?: string;
  contactPerson?: string;
  gstin?: string;
  estimatedQty?: string;
  notes?: string;
  
  // Common fields
  mobileNumber: string;
  email?: string;
  productId?: string;
  productName?: string;
  createdAt: string;
}

export interface UpdateEnquiryStatusRequest {
  status: EnquiryStatus;
}

/* ---------- Locations ---------- */
export interface CityDto {
  cityId: UUID;
  cityName: string;
  stateName: string;
  cityImage?: string;
  isPopular: boolean;
  isCodAvailable: boolean;
  isExchangeAvailable: boolean;
  pincodeCount: number;
}

export interface CreateCityRequest {
  cityName: string;
  stateName: string;
  cityImage?: string;
  isPopular?: boolean;
  isCodAvailable?: boolean;
  isExchangeAvailable?: boolean;
}

export type UpdateCityRequest = Partial<CreateCityRequest>;

export interface PincodeDto {
  pincodeId: UUID;
  code: string;
}

export interface AddPincodeRequest {
  codes: string[];
}

export interface PincodeCheckResponse {
  serviceable: boolean;
  city: CityDto | null;
}

export interface FaqRequest {
  pageType: "UNIVERSAL" | "CATEGORY" | "MANUFACTURER" | "BRAND" | "BRAND_MODEL" | "PRODUCT";
  title: string;
  description: string;
  isActive: boolean;
}

export interface FaqResponse {
  faqId: string;
  pageType: "UNIVERSAL" | "CATEGORY" | "MANUFACTURER" | "BRAND" | "BRAND_MODEL" | "PRODUCT";
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
