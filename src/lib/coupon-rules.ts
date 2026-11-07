import type {
  CouponResponse,
  CouponRequest,
  CouponTargetType,
  ProductDetailResponse,
  ProductListResponse,
  CartItemResponse,
} from "@/types/dto";

const STORAGE_KEY = "bm_coupon_targeting_rules_v1";

/**
 * Local storage sync for targeting rules to guarantee 100% resilience even
 * if the backend database schema hasn't migrated targeting columns yet.
 */
function getStoredRulesMap(): Record<string, Partial<CouponRequest>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredRulesMap(map: Record<string, Partial<CouponRequest>>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Saves targeting rules for a coupon code
 */
export function persistCouponTargeting(code: string, rules: Partial<CouponRequest>) {
  if (!code) return;
  const key = code.trim().toUpperCase();
  const map = getStoredRulesMap();
  map[key] = {
    targetType: rules.targetType || "ALL_PRODUCTS",
    targetCategoryIds: rules.targetCategoryIds || [],
    targetCategoryNames: rules.targetCategoryNames || [],
    targetBrandIds: rules.targetBrandIds || [],
    targetBrandNames: rules.targetBrandNames || [],
    targetProductIds: rules.targetProductIds || [],
    excludedProductIds: rules.excludedProductIds || [],
    displayOnPdp: rules.displayOnPdp ?? true,
    pdpHighlightText: rules.pdpHighlightText || "",
  };
  saveStoredRulesMap(map);
}

/**
 * Merges stored targeting rules with a coupon object from the backend
 */
export function enrichCouponWithTargeting(coupon: CouponResponse): CouponResponse {
  const key = (coupon.code || "").trim().toUpperCase();
  const map = getStoredRulesMap();
  const stored = map[key] || {};

  return {
    ...coupon,
    targetType: coupon.targetType || stored.targetType || "ALL_PRODUCTS",
    targetCategoryIds: coupon.targetCategoryIds || stored.targetCategoryIds || [],
    targetCategoryNames: coupon.targetCategoryNames || stored.targetCategoryNames || [],
    targetBrandIds: coupon.targetBrandIds || stored.targetBrandIds || [],
    targetBrandNames: coupon.targetBrandNames || stored.targetBrandNames || [],
    targetProductIds: coupon.targetProductIds || stored.targetProductIds || [],
    excludedProductIds: coupon.excludedProductIds || stored.excludedProductIds || [],
    displayOnPdp: coupon.displayOnPdp ?? stored.displayOnPdp ?? true,
    pdpHighlightText: coupon.pdpHighlightText || stored.pdpHighlightText || "",
  };
}

/**
 * Formats user-friendly discount label (e.g. "Flat ₹200 OFF" or "10% OFF")
 */
export function formatCouponDiscountLabel(coupon: {
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscountAmount?: number | null;
}): string {
  if (coupon.discountType === "PERCENTAGE") {
    const maxText = coupon.maxDiscountAmount ? ` (Up to ₹${coupon.maxDiscountAmount.toLocaleString("en-IN")})` : "";
    return `${coupon.discountValue}% OFF${maxText}`;
  }
  return `Flat ₹${coupon.discountValue.toLocaleString("en-IN")} OFF`;
}

/**
 * Evaluates whether a specific product is eligible for a given coupon.
 */
export function isProductEligibleForCoupon(
  coupon: CouponResponse,
  product: ProductDetailResponse | ProductListResponse
): boolean {
  // 1. Basic Active check
  if (!coupon.isActive) return false;

  // 2. Date checks
  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) return false;
  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) return false;

  // 3. Usage limit check
  if (coupon.usageLimit && (coupon.usedCount ?? 0) >= coupon.usageLimit) return false;

  const enriched = enrichCouponWithTargeting(coupon);
  const targetType: CouponTargetType = enriched.targetType || "ALL_PRODUCTS";

  const productId = product.productId;
  const categoryId = product.categoryId;
  const brandId = (product as any).brandId;
  const brandName = (product.brandName || "").trim().toLowerCase();
  const categoryName = ((product as any).categoryName || (product as any).productCategory || "").trim().toLowerCase();

  switch (targetType) {
    case "ALL_PRODUCTS":
      return true;

    case "CATEGORIES": {
      const targetCatIds = new Set(enriched.targetCategoryIds || []);
      const targetCatNames = (enriched.targetCategoryNames || []).map((n) => n.trim().toLowerCase());

      if (categoryId && targetCatIds.has(categoryId)) return true;
      if (categoryName && targetCatNames.includes(categoryName)) return true;
      if ((product as any).categories && Array.isArray((product as any).categories)) {
        if ((product as any).categories.some((c: any) => targetCatIds.has(c.categoryId))) return true;
      }
      return false;
    }

    case "BRANDS": {
      const targetBrandIds = new Set(enriched.targetBrandIds || []);
      const targetBrandNames = (enriched.targetBrandNames || []).map((n) => n.trim().toLowerCase());

      if (brandId && targetBrandIds.has(brandId)) return true;
      if (brandName && targetBrandNames.includes(brandName)) return true;
      return false;
    }

    case "CUSTOM_PRODUCTS": {
      const targetProductIds = new Set(enriched.targetProductIds || []);
      return targetProductIds.has(productId);
    }

    case "EXCLUDED_PRODUCTS": {
      const excludedIds = new Set(enriched.excludedProductIds || []);
      return !excludedIds.has(productId);
    }

    default:
      return true;
  }
}

/**
 * Validates a coupon against all cart items and evaluates targeting rules.
 */
export function validateCartCouponEligibility(
  coupon: CouponResponse,
  cartItems: CartItemResponse[],
  cartTotal: number
): { isValid: boolean; message: string; discountAmount: number } {
  const enriched = enrichCouponWithTargeting(coupon);

  // 1. Min order value
  if (enriched.minOrderValue && cartTotal < enriched.minOrderValue) {
    return {
      isValid: false,
      message: `Minimum order value of ₹${enriched.minOrderValue.toLocaleString("en-IN")} required for coupon ${enriched.code}.`,
      discountAmount: 0,
    };
  }

  // 2. Target check: Cart must have at least one eligible product
  const targetType = enriched.targetType || "ALL_PRODUCTS";
  if (targetType !== "ALL_PRODUCTS" && cartItems.length > 0) {
    const eligibleItems = cartItems.filter((item) => isProductEligibleForCoupon(enriched, item.product));

    if (eligibleItems.length === 0) {
      let specificMsg = `Coupon '${enriched.code}' is not valid for the items in your cart.`;
      if (targetType === "CATEGORIES" && enriched.targetCategoryNames && enriched.targetCategoryNames.length > 0) {
        specificMsg = `Coupon '${enriched.code}' is only valid on ${enriched.targetCategoryNames.join(", ")}.`;
      } else if (targetType === "BRANDS" && enriched.targetBrandNames && enriched.targetBrandNames.length > 0) {
        specificMsg = `Coupon '${enriched.code}' is only valid on ${enriched.targetBrandNames.join(", ")} batteries.`;
      }
      return {
        isValid: false,
        message: specificMsg,
        discountAmount: 0,
      };
    }
  }

  // 3. Calculate discount amount
  let discountAmount = 0;
  if (enriched.discountType === "PERCENTAGE") {
    discountAmount = Math.round((cartTotal * enriched.discountValue) / 100);
    if (enriched.maxDiscountAmount && discountAmount > enriched.maxDiscountAmount) {
      discountAmount = enriched.maxDiscountAmount;
    }
  } else {
    discountAmount = enriched.discountValue;
  }

  // Discount cannot exceed cart total
  discountAmount = Math.min(discountAmount, cartTotal);

  return {
    isValid: true,
    message: `Coupon '${enriched.code}' applied successfully!`,
    discountAmount,
  };
}

