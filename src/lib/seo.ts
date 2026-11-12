import { notFound } from "@tanstack/react-router";
import { APP } from "@/constants/app";
import { getBrandSlug, toSlug } from "@/lib/utils";

const INVALID_LITERAL_SLUGS = new Set(["undefined", "null", "nan", "none"]);

function safeDecodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Detects unsubstituted route/template placeholders (e.g. `$categorySlug`, `%24categorySlug`,
 * `{city_name}`, `undefined`) so dynamic SEO routes return 404 instead of indexing broken URLs.
 */
export function isInvalidRouteSlug(value?: string | null): boolean {
  if (!value) return true;
  const raw = value.trim();
  if (!raw) return true;

  if (/%24|%7b|%7d|%3c|%3e/i.test(raw)) return true;

  const decoded = safeDecodeSlug(raw).trim();
  if (!decoded) return true;
  if (/[$<>{}]/.test(decoded)) return true;

  const normalized = decoded.toLowerCase();
  if (INVALID_LITERAL_SLUGS.has(normalized)) return true;

  return false;
}

/** Returns true if any provided route slug segment is missing or contains a placeholder/garbage value. */
export function hasAnyInvalidRouteSlug(...slugs: Array<string | undefined | null>): boolean {
  return slugs.some((slug) => isInvalidRouteSlug(slug));
}

/** Throws TanStack Router `notFound()` if any provided route slug segment is invalid. */
export function assertValidRouteSlugs(...slugs: Array<string | undefined | null>): void {
  if (hasAnyInvalidRouteSlug(...slugs)) {
    throw notFound();
  }
}

function normalizeCategorySlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/-batteries$/, "-battery")
    .replace(/\s+/g, "-");
}

/** Recursively resolves a category or subcategory by slug (including singular/plural battery aliases). */
export function findCategoryBySlug(categories: any[] | undefined, slug?: string | null): any | undefined {
  if (!categories || categories.length === 0 || !slug) return undefined;
  const target = slug.toLowerCase().trim();
  const normTarget = normalizeCategorySlug(target);
  const simplifiedTarget = normTarget.replace(/-battery$/, "");

  const visit = (cats: any[]): any | undefined => {
    for (const c of cats) {
      if (!c) continue;
      const cSlug = c.categorySlug ? String(c.categorySlug).toLowerCase().trim() : "";
      const cNameSlug = toSlug(c.categoryName);
      const normCSlug = cSlug ? normalizeCategorySlug(cSlug) : "";
      const normCNameSlug = cNameSlug ? normalizeCategorySlug(cNameSlug) : "";

      if (
        cSlug === target ||
        cNameSlug === target ||
        (normCSlug && normCSlug === normTarget) ||
        (normCNameSlug && normCNameSlug === normTarget) ||
        (simplifiedTarget.length > 3 && normCNameSlug.replace(/-battery$/, "") === simplifiedTarget) ||
        (/(^|-)car(-|$)/.test(target) && /(^|\s)car(\s|$)/i.test(c.categoryName || ""))
      ) {
        return c;
      }

      if (Array.isArray(c.subCategories) && c.subCategories.length > 0) {
        const subMatch = visit(c.subCategories);
        if (subMatch) return subMatch;
      }
    }
    return undefined;
  };

  return visit(categories);
}

/** Resolves a brand by its SEO/custom slug or normalized brand name slug. */
export function findBrandBySlug(brands: any[] | undefined, slug?: string | null): any | undefined {
  if (!brands || brands.length === 0 || !slug) return undefined;
  const target = slug.toLowerCase().trim();
  return brands.find(
    (b: any) =>
      getBrandSlug(b).toLowerCase() === target ||
      toSlug(b?.brandName) === target
  );
}

/** Combines brand and optional category cleanly without duplicating trailing "Battery" on battery-named brands. */
export function formatBrandCategoryPhrase(brandName: string, categoryName?: string | null): string {
  const cleanBrand = brandName.trim();
  const cleanCat = categoryName?.trim();
  if (!cleanCat) {
    return /\bbatter(?:y|ies)\b/i.test(cleanBrand) ? cleanBrand : `${cleanBrand} Battery`;
  }
  return `${cleanBrand} ${cleanCat}`.trim();
}

export function notFoundHead(title = `Page Not Found | ${APP.name}`) {
  return buildPageHead(
    { metaTitle: title, noIndex: true },
    { title, noIndex: true }
  );
}

export interface PageSeoData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

const BASE_ORIGIN = "https://batterymantra.com";

export function normalizeCanonicalUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  let clean = url.trim();
  if (!clean) return undefined;

  // Relative path handling
  if (clean.startsWith("/")) {
    clean = `${BASE_ORIGIN}${clean}`;
  }

  // Force HTTPS and non-www batterymantra.com canonical
  clean = clean.replace(/^http:\/\//i, "https://");
  clean = clean.replace(/^https:\/\/www\.batterymantra\.com/i, BASE_ORIGIN);
  clean = clean.replace(/^https:\/\/batterymantra\.in/i, BASE_ORIGIN);
  clean = clean.replace(/^https:\/\/www\.batterymantra\.in/i, BASE_ORIGIN);

  return clean;
}

export function buildPageHead(
  seoData?: PageSeoData | null,
  defaults?: {
    title?: string;
    description?: string;
    image?: string;
    canonicalUrl?: string;
    path?: string;
    noIndex?: boolean;
  }
) {
  const title = seoData?.metaTitle || defaults?.title || `${APP.name} — ${APP.tagline}`;
  const description = seoData?.metaDescription || defaults?.description || APP.tagline;
  const keywords = seoData?.metaKeywords || "";
  const ogTitle = seoData?.ogTitle || title;
  const ogDescription = seoData?.ogDescription || description;
  const ogImage = seoData?.ogImage || defaults?.image || "https://batterymantra.com/logo.png";
  const ogType = seoData?.ogType || "website";
  const isNoIndex = seoData?.noIndex ?? defaults?.noIndex ?? false;

  const rawCanonical =
    seoData?.canonicalUrl ||
    defaults?.canonicalUrl ||
    (defaults?.path ? `${BASE_ORIGIN}${defaults.path.startsWith("/") ? "" : "/"}${defaults.path}` : undefined);

  const canonical = normalizeCanonicalUrl(rawCanonical);

  const metaList: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:site_name", content: APP.name },
    { property: "og:type", content: ogType },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:image", content: ogImage },
    { property: "og:image:secure_url", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@batterymantra" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
    { name: "twitter:image", content: ogImage },
  ];

  if (isNoIndex) {
    metaList.push({ name: "robots", content: "noindex,nofollow" });
  }

  if (keywords) {
    metaList.push({ name: "keywords", content: keywords });
  }

  if (canonical) {
    metaList.push({ property: "og:url", content: canonical });
  }

  return {
    meta: metaList,
    links: canonical ? [{ rel: "canonical", href: canonical }] : [],
  };
}
