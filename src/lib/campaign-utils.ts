import { format } from "date-fns";
import type { CampaignResponse, CampaignBadgeTheme, ProductListResponse } from "@/types/dto";

export function getCampaignThemeStyles(theme?: CampaignBadgeTheme | null) {
  switch (theme) {
    case "FESTIVE_GOLD":
      return {
        badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-amber-500/25",
        barBg: "bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 text-amber-50 border-amber-500/30",
        accentText: "text-amber-400",
        pillBg: "bg-amber-500/20 text-amber-200 border-amber-400/30",
        buttonVariant: "bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold",
        cardBorder: "border-amber-500/40 hover:border-amber-500",
      };
    case "ROYAL_BLUE":
      return {
        badgeBg: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/25",
        barBg: "bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-blue-50 border-blue-500/30",
        accentText: "text-blue-400",
        pillBg: "bg-blue-500/20 text-blue-200 border-blue-400/30",
        buttonVariant: "bg-blue-600 hover:bg-blue-500 text-white font-bold",
        cardBorder: "border-blue-500/40 hover:border-blue-500",
      };
    case "EMERALD_GREEN":
      return {
        badgeBg: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25",
        barBg: "bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-emerald-50 border-emerald-500/30",
        accentText: "text-emerald-400",
        pillBg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
        buttonVariant: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold",
        cardBorder: "border-emerald-500/40 hover:border-emerald-500",
      };
    case "BRAND_RED":
    default:
      return {
        badgeBg: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/25",
        barBg: "bg-gradient-to-r from-red-950 via-rose-950 to-neutral-950 text-rose-50 border-red-500/30",
        accentText: "text-red-400",
        pillBg: "bg-red-500/20 text-red-200 border-red-400/30",
        buttonVariant: "bg-red-600 hover:bg-red-500 text-white font-bold",
        cardBorder: "border-red-500/40 hover:border-red-500",
      };
  }
}

export function formatCampaignDiscountLabel(
  campaign: CampaignResponse,
  product?: ProductListResponse
): string {
  if (product && campaign.productDiscounts?.[product.productId] !== undefined) {
    const custom = campaign.productDiscounts[product.productId];
    if (custom !== null && Number(custom) > 0) {
      return `Save ₹${Number(custom).toLocaleString()}`;
    }
  }
  if (campaign.discountType === "FLAT_AMOUNT") {
    return `Flat ₹${Number(campaign.discountValue || 0).toLocaleString()} OFF`;
  }
  if (campaign.discountType === "PERCENTAGE") {
    const cap = campaign.maxDiscountCap ? ` (Up to ₹${Number(campaign.maxDiscountCap).toLocaleString()})` : "";
    return `${campaign.discountValue}% OFF${cap}`;
  }
  if (campaign.discountType === "EXTRA_EXCHANGE_BONUS") {
    return `+₹${Number(campaign.discountValue || 0).toLocaleString()} Extra Exchange Bonus`;
  }
  return campaign.badgeText || "Special Offer";
}

export function isProductEligibleForCampaign(
  product: ProductListResponse,
  campaign: CampaignResponse
): boolean {
  if (!campaign.isActive) return false;

  const now = new Date();
  if (campaign.startDate && new Date(campaign.startDate) > now) return false;
  if (campaign.endDate && new Date(campaign.endDate) < now) return false;

  // Check exclusions
  if (campaign.excludedProductIds?.includes(product.productId)) {
    return false;
  }

  switch (campaign.targetType) {
    case "ALL_PRODUCTS":
      return true;

    case "CATEGORIES": {
      if (!campaign.categoryIds || campaign.categoryIds.length === 0) return false;
      if (product.categoryId && campaign.categoryIds.includes(product.categoryId)) {
        return true;
      }
      if (product.categories && product.categories.some((c) => campaign.categoryIds?.includes(c.categoryId))) {
        return true;
      }
      return false;
    }

    case "BRANDS": {
      if (!campaign.brandIds || campaign.brandIds.length === 0) return false;
      const brandId = (product as any).brandId || (product as any).brand?.id;
      if (brandId && campaign.brandIds.includes(brandId)) {
        return true;
      }
      // Also match brand name if brandId isn't on product list response
      const brandName = (product.brandName || "").toLowerCase();
      return (campaign as any).brandNames?.some?.((b: string) => b.toLowerCase() === brandName) || false;
    }

    case "CUSTOM_PRODUCTS": {
      if (!campaign.productIds || campaign.productIds.length === 0) return false;
      return campaign.productIds.includes(product.productId);
    }

    default:
      return false;
  }
}

export function calculateProductCampaignDiscount(
  product: ProductListResponse,
  campaign: CampaignResponse,
  hasExchange = false
): { discountAmount: number; finalPrice: number } {
  const basePrice = hasExchange && product.exchangeDiscount
    ? Math.max(0, product.productPrice - product.exchangeDiscount)
    : product.productPrice;

  // 1. Check if campaign has a per-product custom discount override
  const customVal = campaign.productDiscounts?.[product.productId];
  if (customVal !== undefined && customVal !== null && Number(customVal) >= 0) {
    const discountAmount = Math.min(basePrice, Number(customVal));
    const finalPrice = Math.max(0, basePrice - discountAmount);
    return { discountAmount: Math.round(discountAmount), finalPrice: Math.round(finalPrice) };
  }

  let discountAmount = 0;

  if (campaign.minOrderValue && basePrice < campaign.minOrderValue) {
    return { discountAmount: 0, finalPrice: basePrice };
  }

  switch (campaign.discountType) {
    case "FLAT_AMOUNT":
      discountAmount = Math.min(basePrice, campaign.discountValue || 0);
      break;

    case "PERCENTAGE": {
      const pct = (campaign.discountValue || 0) / 100;
      let calculated = basePrice * pct;
      if (campaign.maxDiscountCap && calculated > campaign.maxDiscountCap) {
        calculated = campaign.maxDiscountCap;
      }
      discountAmount = Math.min(basePrice, calculated);
      break;
    }

    case "EXTRA_EXCHANGE_BONUS":
      if (hasExchange) {
        discountAmount = Math.min(basePrice, campaign.discountValue || 0);
      }
      break;

    case "SHOWCASE_ONLY":
    default:
      discountAmount = 0;
      break;
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);
  return { discountAmount: Math.round(discountAmount), finalPrice: Math.round(finalPrice) };
}

export function safeFormatDate(dateStr?: string | null, fmt = "dd MMM yy"): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, fmt);
  } catch {
    return "N/A";
  }
}
