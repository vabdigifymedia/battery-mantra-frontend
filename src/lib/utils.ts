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

export function applySeoTemplate(template?: string | null, context: Record<string, string> = {}): string {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    // Matches both {key} and {{key}} with optional whitespace inside
    const regex = new RegExp(`\\{{1,2}\\s*${key}\\s*\\}{1,2}`, 'gi');
    result = result.replace(regex, value || "");
  }
  // Safety fallback: if delivery_time is still unreplaced, replace with context value or standard fallback
  if (/\{{1,2}\s*delivery_time\s*\}{1,2}/i.test(result)) {
    const fallback = context.delivery_time || "1-2 Hours";
    result = result.replace(/\{{1,2}\s*delivery_time\s*\}{1,2}/gi, fallback);
  }
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
 * Resolves a vehicle's URL slug, prioritizing custom saved slug, then fallback to make-model-fuel.
 */
export function getVehicleSlug(v?: { slug?: string; make?: string; model?: string; fuelName?: string } | null): string {
  if (!v) return "";
  if (v.slug && v.slug.trim()) return v.slug.trim();
  const fuel = v.fuelName ? `-${toSlug(v.fuelName)}` : "";
  return `${toSlug(v.make)}-${toSlug(v.model)}${fuel}`;
}

