import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useLocationStore } from "@/store/useLocationStore";
import { getDeliveryTimeText } from "@/lib/delivery";
import type { PageSeoData } from "@/lib/seo";

export interface SeoTemplate {
  templateId: string;
  templateType: string;
  seoTitleTemplate?: string;
  seoDescriptionTemplate?: string;
  seoKeywordsTemplate?: string;
  ogTitleTemplate?: string;
  ogDescriptionTemplate?: string;
  shortDescriptionTemplate?: string;
}

/**
 * Query to fetch all SEO templates. Long staleTime since these rarely change.
 */
export const seoTemplatesQuery = () =>
  queryOptions({
    queryKey: ["seo", "templates"],
    queryFn: () => apiFetch<SeoTemplate[]>("/api/seo/templates"),
    staleTime: 5 * 60_000, // 5 minutes
  });

/**
 * Extracts battery Ah capacity (e.g. "35 Ah", "45 Ah", "DIN-74 Ah") from vehicle and products.
 */
export function extractBatteryCapacity(
  vehicle?: { capacity?: string | null } | null,
  products?: Array<{ capacity?: string | null; capacityAh?: string | null; productName?: string | null; specDetails?: any[]; specs?: any }>
): string {
  // 1. Check product capacityAh
  if (products && products.length > 0) {
    for (const p of products) {
      if (p.capacityAh && /\d+/.test(p.capacityAh)) {
        const val = p.capacityAh.trim();
        return /ah/i.test(val) ? val : `${val} Ah`;
      }
    }
    // 2. Check product specs / specDetails
    for (const p of products) {
      const item = p as any;
      if (Array.isArray(item.specDetails)) {
        const capSpec = item.specDetails.find(
          (s: any) =>
            (s.attributeName && /capacity/i.test(s.attributeName)) ||
            (s.value && /\d+\s*Ah/i.test(s.value))
        );
        if (capSpec?.value) {
          const val = String(capSpec.value).trim();
          if (/^\d+$/.test(val)) return `${val} Ah`;
          if (/\d+\s*Ah/i.test(val)) return val;
        }
      }
      if (item.specs && typeof item.specs === "object") {
        const capKey = Object.keys(item.specs).find((k) => /capacity|ah/i.test(k));
        if (capKey && item.specs[capKey]) {
          const val = String(item.specs[capKey]).trim();
          if (/^\d+$/.test(val)) return `${val} Ah`;
          if (/\d+\s*Ah/i.test(val)) return val;
        }
      }
    }
    // 3. Check product name (e.g. "Amaron Flo 72 Ah", "Exide 45Ah")
    for (const p of products) {
      const matchName = p.productName?.match(/\b(\d+)\s*Ah\b/i);
      if (matchName) return `${matchName[1]} Ah`;
    }
    // 4. Check product capacity field if it contains Ah or DIN number (not just R/L layout)
    for (const p of products) {
      const cap = p.capacity?.trim();
      if (cap && !/^(r\/l|l\/r|rl|lr|r|l)$/i.test(cap)) {
        const ahMatch = cap.match(/(\d+)\s*Ah/i);
        if (ahMatch) return `${ahMatch[1]} Ah`;
        const dinMatch = cap.match(/DIN[- ]?(\d+)/i);
        if (dinMatch) return `${dinMatch[1]} Ah`;
        const numMatch = cap.match(/^(\d+)[LR]?\b/i);
        if (numMatch) return `${numMatch[1]} Ah`;
      }
    }
  }

  // 5. Check vehicle.capacity (often stores DIN-74, DIN-100, 35R CAR etc. - extract the number)
  if (vehicle?.capacity) {
    const vCap = String(vehicle.capacity).trim();
    if (!/^(r\/l|l\/r|rl|lr|r|l)$/i.test(vCap)) {
      const ahMatch = vCap.match(/(\d+)\s*Ah/i);
      if (ahMatch) return `${ahMatch[1]} Ah`;
      const dinMatch = vCap.match(/DIN[- ]?(\d+)/i);
      if (dinMatch) return `${dinMatch[1]} Ah`;
      const numMatch = vCap.match(/(\d+)\s*[LR]?\b/i);
      if (numMatch) return `${numMatch[1]} Ah`;
    }
  }

  return "";
}

/**
 * Calculates With-Exchange price statistics and warranty ranges from a product list.
 */
export function extractProductPriceStats(products?: any[]) {
  if (!products || products.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 0,
      priceFormatted: "",
      priceLowestFormatted: "",
      priceHighestFormatted: "",
      priceRangeFormatted: "",
      warrantyRangeFormatted: "",
    };
  }

  const withExchangePrices = products
    .map((p: any) => Math.max(0, (p.productPrice || 0) - (p.exchangeDiscount || 0)))
    .filter((p: number) => p > 0);

  const minPrice = withExchangePrices.length > 0 ? Math.min(...withExchangePrices) : 0;
  const maxPrice = withExchangePrices.length > 0 ? Math.max(...withExchangePrices) : 0;

  const priceLowestFormatted = minPrice > 0 ? `₹${minPrice.toLocaleString("en-IN")}` : "";
  const priceHighestFormatted = maxPrice > 0 ? `₹${maxPrice.toLocaleString("en-IN")}` : "";
  const priceRangeFormatted = minPrice > 0
    ? (minPrice === maxPrice ? `₹${minPrice.toLocaleString("en-IN")}` : `₹${minPrice.toLocaleString("en-IN")} - ₹${maxPrice.toLocaleString("en-IN")}`)
    : "";

  // Warranty extraction from products
  const warranties: number[] = [];
  for (const p of products) {
    const textToScan = `${p.productName || ""} ${p.highlights || ""} ${p.capacity || ""}`;
    const match = textToScan.match(/(\d+)\s*(?:months?|m\b)/i);
    if (match) {
      const months = parseInt(match[1], 10);
      if (months >= 12 && months <= 120) warranties.push(months);
    }
  }
  const minWarranty = warranties.length > 0 ? Math.min(...warranties) : 0;
  const maxWarranty = warranties.length > 0 ? Math.max(...warranties) : 0;
  const warrantyRangeFormatted = minWarranty > 0
    ? (minWarranty === maxWarranty ? `${minWarranty} Months` : `${minWarranty} - ${maxWarranty} Months`)
    : "";

  return {
    minPrice,
    maxPrice,
    priceFormatted: priceLowestFormatted,
    priceLowestFormatted,
    priceHighestFormatted,
    priceRangeFormatted,
    warrantyRangeFormatted,
  };
}

/**
 * Replace template variables like {brand_name}, {city_name}, {capacity}, {price_range}, etc.
 */
function replaceVars(template: string | undefined | null, vars: Record<string, string>): string {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    // If value already starts with currency symbol (₹), prevent double symbol (e.g. ₹{price} -> ₹₹3,500)
    if (value && /^\s*₹/.test(value)) {
      const regexWithCurrency = new RegExp(`(?:₹|Rs\\.?|INR\\s*)\\s*\\{{1,2}\\s*${key}\\s*\\}{1,2}`, "gi");
      result = result.replace(regexWithCurrency, value);
    }
    const regex = new RegExp(`\\{\\{?\\s*${key}\\s*\\}\\}?`, "gi");
    result = result.replace(regex, value || "");
  }
  // Safety: if template still has unreplaced delivery_time, resolve with fallback
  if (/\{{1,2}\s*delivery_time\s*\}{1,2}/i.test(result)) {
    result = result.replace(/\{{1,2}\s*delivery_time\s*\}{1,2}/gi, vars.delivery_time || "1-2 Hours");
  }
  // Deduplicate accidental repeated manufacturer name (e.g. "Honda Honda Amaze" -> "Honda Amaze")
  if (vars.manufacturer_name) {
    const m = vars.manufacturer_name.trim();
    if (m) {
      const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(`\\b(${escaped})\\s+\\1\\b`, "gi"), "$1");
    }
  }
  // Clean multiple consecutive whitespace
  result = result.replace(/[ \t]{2,}/g, " ").trim();
  return result;
}

type SeoEntityType = "BRAND" | "CATEGORY" | "MANUFACTURER" | "PRODUCT" | "DEALER" | "SUB_MANUFACTURER";

/**
 * Resolves SEO metadata using this priority:
 * 1. Entity's own SEO (e.g., Brand.seo.metaTitle) — highest priority
 * 2. SEO Quick template for the entity type — variables replaced
 * 3. Hardcoded defaults — lowest priority
 */
export function resolveTemplateSeo(
  entityType: SeoEntityType,
  templates: SeoTemplate[] | undefined,
  vars: Record<string, string>,
  entitySeo?: PageSeoData | null,
  defaults?: { title?: string; description?: string }
): PageSeoData {
  const city = useLocationStore.getState().city;
  const cityName = vars.city_name || city?.cityName || "";
  const deliveryTime = vars.delivery_time || getDeliveryTimeText(null, null, cityName);

  // Common aliases for capacity, price, and fuel variables
  const capacityVal = vars.capacity || vars.battery_capacity || "";
  const priceLowVal = vars.price_low || vars.price_lowest || vars.price || "";
  const priceHighVal = vars.price_high || vars.price_highest || "";
  const fuelVal = vars.fuel_type || vars.fuel_name || "";

  // Merge city_name, delivery_time and aliases into vars
  const allVars: Record<string, string> = {
    delivery_time: deliveryTime,
    ...vars,
    city_name: cityName || "India",
    ...(capacityVal && { capacity: capacityVal, battery_capacity: capacityVal }),
    ...(priceLowVal && { price: priceLowVal, price_low: priceLowVal, price_lowest: priceLowVal }),
    ...(priceHighVal && { price_high: priceHighVal, price_highest: priceHighVal }),
    ...(fuelVal && { fuel_type: fuelVal, fuel_name: fuelVal }),
  };
  if (!allVars.delivery_time) {
    allVars.delivery_time = deliveryTime;
  }

  // Pick the right template variant based on city selection
  const suffix = cityName ? "WITH_CITY" : "WITHOUT_CITY";
  const templateType = `${entityType}_${suffix}`;
  const fallbackType = `${entityType}_WITHOUT_CITY`;

  const template = templates?.find((t) => t.templateType === templateType)
    || templates?.find((t) => t.templateType === fallbackType)
    || (entityType === "DEALER" ? (templates?.find((t) => t.templateType === `BRAND_${suffix}`) || templates?.find((t) => t.templateType === "BRAND_WITHOUT_CITY")) : undefined)
    || (entityType === "SUB_MANUFACTURER" ? (templates?.find((t) => t.templateType === `MANUFACTURER_${suffix}`) || templates?.find((t) => t.templateType === "MANUFACTURER_WITHOUT_CITY")) : undefined);

  // Entity's own SEO fields (with city variant if available)
  const ownSeo = entitySeo || {};

  // Helper to detect if legacy text has hardcoded city references when no city is active
  const hasHardcodedCity = (text?: string | null) => {
    if (!text) return false;
    return /\b(in\s+)?(noida|greater\s+noida|delhi(?:\s*ncr)?|gurgaon|gurugram|faridabad|ghaziabad|mumbai|bangalore|bengaluru|kolkata|chennai|hyderabad|pune|ahmedabad|jaipur|lucknow|chandigarh)\b/i.test(text);
  };

  // If a city IS selected: prefer entity's city variant, otherwise fallback to WITH_CITY template
  // If NO city is selected: if entity has hardcoded city pollution, discard it and use clean WITHOUT_CITY template
  const effectiveOwnTitle = cityName
    ? ((ownSeo as any)?.metaTitleCity ? replaceVars((ownSeo as any).metaTitleCity, allVars) : "")
    : (hasHardcodedCity(ownSeo?.metaTitle) ? "" : (ownSeo?.metaTitle ? replaceVars(ownSeo.metaTitle, allVars) : ""));

  const effectiveOwnDesc = cityName
    ? ((ownSeo as any)?.metaDescriptionCity ? replaceVars((ownSeo as any).metaDescriptionCity, allVars) : "")
    : (hasHardcodedCity(ownSeo?.metaDescription) ? "" : (ownSeo?.metaDescription ? replaceVars(ownSeo.metaDescription, allVars) : ""));

  const effectiveOwnKeywords = cityName
    ? ((ownSeo as any)?.metaKeywordsCity ? replaceVars((ownSeo as any).metaKeywordsCity, allVars) : "")
    : (hasHardcodedCity(ownSeo?.metaKeywords) ? "" : (ownSeo?.metaKeywords ? replaceVars(ownSeo.metaKeywords, allVars) : ""));

  const effectiveOwnOgTitle = cityName
    ? ((ownSeo as any)?.ogTitleCity ? replaceVars((ownSeo as any).ogTitleCity, allVars) : "")
    : (hasHardcodedCity(ownSeo?.ogTitle) ? "" : (ownSeo?.ogTitle ? replaceVars(ownSeo.ogTitle, allVars) : ""));

  const effectiveOwnOgDesc = cityName
    ? ((ownSeo as any)?.ogDescriptionCity ? replaceVars((ownSeo as any).ogDescriptionCity, allVars) : "")
    : (hasHardcodedCity(ownSeo?.ogDescription) ? "" : (ownSeo?.ogDescription ? replaceVars(ownSeo.ogDescription, allVars) : ""));

  // Template-resolved fields
  const tplTitle = replaceVars(template?.seoTitleTemplate, allVars);
  const tplDesc = replaceVars(template?.seoDescriptionTemplate, allVars);
  const tplKeywords = replaceVars(template?.seoKeywordsTemplate, allVars);
  const tplOgTitle = replaceVars(template?.ogTitleTemplate, allVars);
  const tplOgDesc = replaceVars(template?.ogDescriptionTemplate, allVars);

  return {
    metaTitle: effectiveOwnTitle || tplTitle || ownSeo?.metaTitle || defaults?.title || "",
    metaDescription: effectiveOwnDesc || tplDesc || ownSeo?.metaDescription || defaults?.description || "",
    metaKeywords: effectiveOwnKeywords || tplKeywords || ownSeo?.metaKeywords || "",
    ogTitle: effectiveOwnOgTitle || tplOgTitle || effectiveOwnTitle || tplTitle || defaults?.title || "",
    ogDescription: effectiveOwnOgDesc || tplOgDesc || effectiveOwnDesc || tplDesc || defaults?.description || "",
  };
}
