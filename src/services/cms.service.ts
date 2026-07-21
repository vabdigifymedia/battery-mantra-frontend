import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export interface SeoMetadata {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  metaTitleCity?: string;
  metaDescriptionCity?: string;
  metaKeywordsCity?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface CmsPageDto {
  pageId: string;
  title: string;
  subTitle?: string;
  image1?: string;
  image2?: string;
  content: string;
  content2?: string;
  isActive: boolean;
  seo?: SeoMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCmsPageRequest {
  title: string;
  subTitle?: string;
  image1?: string;
  image2?: string;
  content: string;
  content2?: string;
  isActive: boolean;
  seo?: SeoMetadata;
}

export const cmsService = {
  // Public Endpoint
  getPageBySlug: (slug: string): Promise<CmsPageDto> =>
    apiFetch<CmsPageDto>(`${endpoints.cms.public}/${encodeURIComponent(slug)}`, { method: "GET", auth: false }),

  // Admin Endpoints
  getAllPages: (): Promise<CmsPageDto[]> =>
    apiFetch<CmsPageDto[]>(endpoints.cms.admin, { method: "GET" }),

  getPageById: (id: string): Promise<CmsPageDto> =>
    apiFetch<CmsPageDto>(`${endpoints.cms.admin}/${encodeURIComponent(id)}`, { method: "GET" }),

  createPage: (data: CreateCmsPageRequest): Promise<CmsPageDto> =>
    apiFetch<CmsPageDto>(endpoints.cms.admin, {
      method: "POST",
      body: data,
    }),

  updatePage: (id: string, data: CreateCmsPageRequest): Promise<CmsPageDto> =>
    apiFetch<CmsPageDto>(`${endpoints.cms.admin}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: data,
    }),

  deletePage: (id: string): Promise<void> =>
    apiFetch<void>(`${endpoints.cms.admin}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
