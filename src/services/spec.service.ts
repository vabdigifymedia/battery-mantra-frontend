import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  SpecCategoryResponse,
  SpecCategoryRequest,
  SpecAttributeResponse,
  SpecAttributeRequest,
  SpecUnitResponse,
  SpecUnitRequest,
  CategorySpecTemplateResponse,
  UUID,
} from "@/types/dto";

export const specService = {
  // Spec Categories
  getSpecCategories: (categoryId: UUID) =>
    apiFetch<SpecCategoryResponse[]>(`${endpoints.admin.specs.categories}?categoryId=${categoryId}`, { method: "GET" }),
  createSpecCategory: (body: SpecCategoryRequest) =>
    apiFetch<SpecCategoryResponse>(endpoints.admin.specs.categories, { method: "POST", body }),
  deleteSpecCategory: (id: UUID) =>
    apiFetch<void>(`${endpoints.admin.specs.categories}/${id}`, { method: "DELETE" }),

  // Spec Attributes
  getSpecAttributes: (specCategoryId: UUID) =>
    apiFetch<SpecAttributeResponse[]>(`${endpoints.admin.specs.attributes}?specCategoryId=${specCategoryId}`, { method: "GET" }),
  createSpecAttribute: (body: SpecAttributeRequest) =>
    apiFetch<SpecAttributeResponse>(endpoints.admin.specs.attributes, { method: "POST", body }),
  deleteSpecAttribute: (id: UUID) =>
    apiFetch<void>(`${endpoints.admin.specs.attributes}/${id}`, { method: "DELETE" }),

  // Spec Units
  getSpecUnits: (attributeId: UUID) =>
    apiFetch<SpecUnitResponse[]>(`${endpoints.admin.specs.units}?attributeId=${attributeId}`, { method: "GET" }),
  createSpecUnit: (body: SpecUnitRequest) =>
    apiFetch<SpecUnitResponse>(endpoints.admin.specs.units, { method: "POST", body }),
  deleteSpecUnit: (id: UUID) =>
    apiFetch<void>(`${endpoints.admin.specs.units}/${id}`, { method: "DELETE" }),

  // Category Spec Template (hierarchical tree)
  getCategorySpecTemplate: (categoryId: UUID) =>
    apiFetch<CategorySpecTemplateResponse>(endpoints.admin.specs.template(categoryId), { method: "GET" }),
};
