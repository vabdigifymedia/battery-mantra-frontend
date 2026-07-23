import { apiFetch } from "@/lib/api/client";
import { FaqRequest, FaqResponse } from "@/types/dto";

class FaqService {
  async getAllFaqs(): Promise<FaqResponse[]> {
    return apiFetch<FaqResponse[]>("/admin/faqs");
  }

  async createFaq(data: FaqRequest): Promise<FaqResponse> {
    return apiFetch<FaqResponse>("/admin/faqs", { method: "POST", body: data });
  }

  async updateFaq(id: string, data: FaqRequest): Promise<FaqResponse> {
    return apiFetch<FaqResponse>(`/admin/faqs/${id}`, { method: "PUT", body: data });
  }

  async deleteFaq(id: string): Promise<void> {
    await apiFetch(`/admin/faqs/${id}`, { method: "DELETE" });
  }

  async getPublicFaqsByPage(pageType: string): Promise<FaqResponse[]> {
    return apiFetch<FaqResponse[]>(`/faqs/public?pageType=${pageType}`);
  }
}

export const faqService = new FaqService();
