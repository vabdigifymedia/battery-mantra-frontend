import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const toSlug = (text?: string) => text ? text.toLowerCase().trim().replace(/\s+/g, "-") : "";

export const KNOWN_BLOG_CITIES = [
  { slug: "delhi", name: "Delhi" },
  { slug: "noida", name: "Noida" },
  { slug: "gurgaon", name: "Gurgaon" },
  { slug: "gurugram", name: "Gurugram" },
  { slug: "faridabad", name: "Faridabad" },
  { slug: "ghaziabad", name: "Ghaziabad" },
  { slug: "greater-noida", name: "Greater Noida" },
  { slug: "delhi-ncr", name: "Delhi NCR" },
];

/**
 * Detects if a blog slug contains a known city name or city slug (e.g. -in-noida, -delhi).
 */
export function detectCityFromSlug(slug: string): { slug: string; name: string } | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  for (const c of KNOWN_BLOG_CITIES) {
    const pattern = new RegExp(`(?:-in-|-)${c.slug}(?:$|-)`, "i");
    if (pattern.test(s) || s === c.slug) {
      return c;
    }
  }
  return null;
}

/**
 * Generates candidate slugs to query when looking up a blog post that may be parameterized
 * with {city_name} or city suffixes (e.g. best-battery-in-noida -> best-battery-in-{city_name}, etc.)
 */
export function generateCandidateSlugs(slug: string): string[] {
  if (!slug) return [];
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const candidates = new Set<string>();
  candidates.add(decoded);

  const detected = detectCityFromSlug(decoded);
  if (detected) {
    // 1. Replace city slug with {city_name}
    candidates.add(decoded.replace(new RegExp(`-in-${detected.slug}\\b`, "i"), "-in-{city_name}"));
    candidates.add(decoded.replace(new RegExp(`-${detected.slug}\\b`, "i"), "-{city_name}"));
    candidates.add(decoded.replace(new RegExp(`\\b${detected.slug}\\b`, "i"), "{city_name}"));

    // 2. Replace city slug with default 'delhi'
    candidates.add(decoded.replace(new RegExp(`-in-${detected.slug}\\b`, "i"), "-in-delhi"));
    candidates.add(decoded.replace(new RegExp(`-${detected.slug}\\b`, "i"), "-delhi"));

    // 3. Strip city altogether
    candidates.add(decoded.replace(new RegExp(`-in-${detected.slug}\\b`, "i"), ""));
    candidates.add(decoded.replace(new RegExp(`-${detected.slug}\\b`, "i"), ""));
  } else {
    // If slug has no city (e.g. best-car-battery), also try {city_name} and delhi versions
    candidates.add(`${decoded}-in-{city_name}`);
    candidates.add(`${decoded}-in-delhi`);
  }

  return Array.from(candidates)
    .map((c) => c.replace(/(^-|-$)+/g, ""))
    .filter(Boolean);
}

/**
 * Sanitizes and generates blog slug, safely preserving {city_name} while slugifying other words.
 */
export function cleanBlogSlug(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/\{city_name\}/gi, "__CITY_VAR__")
    .replace(/\{city\}/gi, "__CITY_VAR__")
    .replace(/\{year\}/gi, new Date().getFullYear().toString())
    .replace(/\{current_year\}/gi, new Date().getFullYear().toString())
    .replace(/[^a-z0-9_ -]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/__CITY_VAR__/g, "{city_name}")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Processes blog text, HTML content, or titles by replacing dynamic variables
 * ({city_name}, {year}, {category_name}, {brand_name}, etc.) with context values.
 */
export function applyBlogVariables(
  text?: string | null,
  context: {
    cityName?: string | null;
    categoryName?: string | null;
    brandName?: string | null;
    manufacturerName?: string | null;
    deliveryTime?: string | null;
    year?: string | null;
    phone?: string | null;
    [key: string]: any;
  } = {}
): string {
  if (!text) return "";
  const city = context.cityName?.trim() || "Delhi NCR";
  const year = context.year || new Date().getFullYear().toString();
  const month = new Date().toLocaleString("en-IN", { month: "long" });
  const category = context.categoryName || "Car Battery";
  const brand = context.brandName || "";
  const make = context.manufacturerName || "";
  const deliveryTime = context.deliveryTime || "1-2 Hours";
  const phone = context.phone || "9200920051";
  const siteName = "Battery Mantra";

  const map: Record<string, string> = {
    city_name: city,
    city: city,
    year: year,
    current_year: year,
    month: month,
    current_month: month,
    category_name: category,
    category: category,
    brand_name: brand,
    brand: brand,
    manufacturer_name: make,
    make: make,
    delivery_time: deliveryTime,
    phone: phone,
    phone_number: phone,
    site_name: siteName,
    app_name: siteName,
  };

  let result = text;
  for (const [k, v] of Object.entries(map)) {
    const regex = new RegExp(`\\{{1,2}\\s*${k}\\s*\\}{1,2}`, "gi");
    result = result.replace(regex, v);
  }

  return result;
}

export function applySeoTemplate(template?: string | null, context: Record<string, string> = {}): string {
  if (!template) return "";
  let result = template;

  // Build aliased context so both short and long forms work
  const enriched: Record<string, string> = { ...context };
  if (enriched.category_name && !enriched.category) enriched.category = enriched.category_name;
  if (enriched.category && !enriched.category_name) enriched.category_name = enriched.category;
  if (enriched.brand_name && !enriched.brand) enriched.brand = enriched.brand_name;
  if (enriched.brand && !enriched.brand_name) enriched.brand_name = enriched.brand;
  if (enriched.city_name && !enriched.city) enriched.city = enriched.city_name;
  if (enriched.city && !enriched.city_name) enriched.city_name = enriched.city;
  if (enriched.manufacturer_name && !enriched.make) enriched.make = enriched.manufacturer_name;
  if (enriched.make && !enriched.manufacturer_name) enriched.manufacturer_name = enriched.make;
  if (enriched.model_name && !enriched.model) enriched.model = enriched.model_name;
  if (enriched.model && !enriched.model_name) enriched.model_name = enriched.model;
  if (enriched.capacity && !enriched.battery_capacity) enriched.battery_capacity = enriched.capacity;
  if (enriched.battery_capacity && !enriched.capacity) enriched.capacity = enriched.battery_capacity;
  if (enriched.price_lowest && !enriched.price) enriched.price = enriched.price_lowest;
  if (enriched.price_lowest && !enriched.price_low) enriched.price_low = enriched.price_lowest;
  if (enriched.price_highest && !enriched.price_high) enriched.price_high = enriched.price_highest;

  // Safety fallback for category if missing in brand/dealer context
  if (!enriched.category_name && (enriched.brand_name || enriched.brand)) {
    enriched.category_name = "Battery";
    enriched.category = "Battery";
  }

  for (const [key, value] of Object.entries(enriched)) {
    if (value === undefined || value === null) continue;
    // If value already starts with currency symbol (₹), avoid double symbols (e.g. ₹{price_lowest} -> ₹₹4,500)
    if (value && /^\s*₹/.test(value)) {
      const regexWithCurrency = new RegExp(`(?:₹|Rs\\.?|INR\\s*)\\s*\\{{1,2}\\s*${key}\\s*\\}{1,2}`, 'gi');
      result = result.replace(regexWithCurrency, value);
    }
    // Matches both {key} and {{key}} with optional whitespace inside
    const regex = new RegExp(`\\{{1,2}\\s*${key}\\s*\\}{1,2}`, 'gi');
    result = result.replace(regex, value || "");
  }
  // Safety fallback: if delivery_time is still unreplaced, replace with context value or standard fallback
  if (/\{{1,2}\s*delivery_time\s*\}{1,2}/i.test(result)) {
    const fallback = enriched.delivery_time || "1-2 Hours";
    result = result.replace(/\{{1,2}\s*delivery_time\s*\}{1,2}/gi, fallback);
  }

  // Clean unreplaced placeholder variables like {foo_bar}
  result = result.replace(/\{{1,2}[a-zA-Z0-9_ -]+\}{1,2}/g, "");
  // Clean multiple spaces that might result
  result = result.replace(/[ \t]{2,}/g, " ");

  return result;
}

/**
 * Converts plural product category phrases to singular for natural grammar in headings and titles.
 * e.g. "Car Batteries" -> "Car Battery", "Inverter Batteries" -> "Inverter Battery"
 */
export function toSingularCategory(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/\bBatteries\b/g, "Battery")
    .replace(/\bbatteries\b/g, "battery")
    .replace(/\bBATTERIES\b/g, "BATTERY")
    .replace(/\bBatterys\b/g, "Battery")
    .replace(/\bbatterys\b/g, "battery")
    .replace(/\bBATTERYS\b/g, "BATTERY")
    .replace(/\bInverters\b/g, "Inverter")
    .replace(/\binverters\b/g, "inverter")
    .replace(/\bINVERTERS\b/g, "INVERTER")
    .replace(/\bPanels\b/g, "Panel")
    .replace(/\bpanels\b/g, "panel")
    .replace(/\bPANELS\b/g, "PANEL")
    .trim();
}

/**
 * Resolves a brand's URL slug, prioritizing custom saved slug, then SEO slug, then fallback to brandName slug.
 */
export function getBrandSlug(b?: { slug?: string; seo?: { slug?: string }; brandName?: string } | null): string {
  if (!b) return "";
  return (b.seo?.slug || b.slug || toSlug(b.brandName)).trim();
}

/**
 * Resolves a vehicle's URL slug, prioritizing custom saved slug, then default to make + model name.
 * Examples:
 * - Make: "Audi", Model: "A3 Diesel" -> "audi-a3-diesel"
 * - Make: "BMW", Model: "5 Series 530i" -> "bmw-5-series-530i"
 */
export function getVehicleSlug(v?: { slug?: string; make?: string; model?: string } | null): string {
  if (!v) return "";
  if (v.slug && v.slug.trim()) return toSlug(v.slug);
  return toSlug(`${v.model || ""}`);
}

