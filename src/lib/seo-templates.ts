import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useLocationStore } from "@/store/useLocationStore";
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
 * Replace template variables like {brand_name}, {city_name}, etc.
 */
function replaceVars(template: string | undefined | null, vars: Record<string, string>): string {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{?\\s*${key}\\s*\\}\\}?`, "gi");
    result = result.replace(regex, value || "");
  }
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

  // Merge city_name into vars
  const allVars = { ...vars, city_name: cityName || "India" };

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
