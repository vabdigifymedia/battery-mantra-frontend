import { APP } from "@/constants/app";

export interface PageSeoData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
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
  }
) {
  const title = seoData?.metaTitle || defaults?.title || `${APP.name} — ${APP.tagline}`;
  const description = seoData?.metaDescription || defaults?.description || APP.tagline;
  const keywords = seoData?.metaKeywords || "";
  const ogTitle = seoData?.ogTitle || title;
  const ogDescription = seoData?.ogDescription || description;
  const ogImage = seoData?.ogImage || defaults?.image || "https://batterymantra.com/logo.png";
  const ogType = seoData?.ogType || "website";

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
