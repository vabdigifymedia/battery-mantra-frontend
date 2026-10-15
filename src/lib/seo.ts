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

export function buildPageHead(
  seoData?: PageSeoData | null,
  defaults?: { title?: string; description?: string; image?: string }
) {
  const title = seoData?.metaTitle || defaults?.title || `${APP.name} — ${APP.tagline}`;
  const description = seoData?.metaDescription || defaults?.description || APP.tagline;
  const keywords = seoData?.metaKeywords || "";
  const ogTitle = seoData?.ogTitle || title;
  const ogDescription = seoData?.ogDescription || description;
  const ogImage = seoData?.ogImage || defaults?.image || "https://batterymantra.com/logo.png";
  const ogType = seoData?.ogType || "website";

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

  if (seoData?.canonicalUrl) {
    metaList.push({ property: "og:url", content: seoData.canonicalUrl });
  }

  return {
    meta: metaList,
    links: seoData?.canonicalUrl ? [{ rel: "canonical", href: seoData.canonicalUrl }] : [],
  };
}
