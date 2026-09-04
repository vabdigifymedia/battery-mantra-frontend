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

type SeoEntityType = "BRAND" | "CATEGORY" | "MANUFACTURER" | "PRODUCT";

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
  const cityName = city?.cityName || "";

  // Merge city_name into vars
  const allVars = { ...vars, city_name: cityName || "India" };

  // Pick the right template variant based on city selection
  const suffix = cityName ? "WITH_CITY" : "WITHOUT_CITY";
  const templateType = `${entityType}_${suffix}`;
  const fallbackType = `${entityType}_WITHOUT_CITY`;

  const template = templates?.find((t) => t.templateType === templateType)
    || templates?.find((t) => t.templateType === fallbackType);

  // Entity's own SEO fields (with city variant if available)
  const ownSeo = entitySeo || {};
  const ownTitle = (cityName && (ownSeo as any)?.metaTitleCity) 
    ? replaceVars((ownSeo as any).metaTitleCity, allVars) 
    : ownSeo?.metaTitle ? replaceVars(ownSeo.metaTitle, allVars) : "";
  const ownDesc = (cityName && (ownSeo as any)?.metaDescriptionCity)
    ? replaceVars((ownSeo as any).metaDescriptionCity, allVars)
    : ownSeo?.metaDescription ? replaceVars(ownSeo.metaDescription, allVars) : "";
  const ownKeywords = (cityName && (ownSeo as any)?.metaKeywordsCity)
    ? replaceVars((ownSeo as any).metaKeywordsCity, allVars)
    : ownSeo?.metaKeywords ? replaceVars(ownSeo.metaKeywords, allVars) : "";
  const ownOgTitle = (cityName && (ownSeo as any)?.ogTitleCity)
    ? replaceVars((ownSeo as any).ogTitleCity, allVars)
    : ownSeo?.ogTitle ? replaceVars(ownSeo.ogTitle, allVars) : "";
  const ownOgDesc = (cityName && (ownSeo as any)?.ogDescriptionCity)
    ? replaceVars((ownSeo as any).ogDescriptionCity, allVars)
    : ownSeo?.ogDescription ? replaceVars(ownSeo.ogDescription, allVars) : "";

  // Template-resolved fields
  const tplTitle = replaceVars(template?.seoTitleTemplate, allVars);
  const tplDesc = replaceVars(template?.seoDescriptionTemplate, allVars);
  const tplKeywords = replaceVars(template?.seoKeywordsTemplate, allVars);
  const tplOgTitle = replaceVars(template?.ogTitleTemplate, allVars);
  const tplOgDesc = replaceVars(template?.ogDescriptionTemplate, allVars);

  return {
    metaTitle: ownTitle || tplTitle || defaults?.title || "",
    metaDescription: ownDesc || tplDesc || defaults?.description || "",
    metaKeywords: ownKeywords || tplKeywords || "",
    ogTitle: ownOgTitle || tplOgTitle || ownTitle || tplTitle || defaults?.title || "",
    ogDescription: ownOgDesc || tplOgDesc || ownDesc || tplDesc || defaults?.description || "",
  };
}
