import { APP } from "@/constants/app";

export interface PageSeoData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
}

export function buildPageHead(
  seoData?: PageSeoData | null,
  defaults?: { title?: string; description?: string }
) {
  const title = seoData?.metaTitle || defaults?.title || `${APP.name} — ${APP.tagline}`;
  const description = seoData?.metaDescription || defaults?.description || APP.tagline;
  const keywords = seoData?.metaKeywords || "";
  const ogTitle = seoData?.ogTitle || title;
  const ogDescription = seoData?.ogDescription || description;

  const metaList: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
  ];

  if (keywords) {
    metaList.push({ name: "keywords", content: keywords });
  }

  if (ogTitle) {
    metaList.push({ property: "og:title", content: ogTitle });
  }

  if (ogDescription) {
    metaList.push({ property: "og:description", content: ogDescription });
  }

  return {
    meta: metaList,
  };
}
