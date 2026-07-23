import { apiClient } from "@/lib/api/client";
import { FaqRequest, FaqResponse } from "@/types/dto";

class FaqService {
  async getAllFaqs(): Promise<FaqResponse[]> {
    const response = await apiClient.get("/admin/faqs");
    return response.data;
  }

  async createFaq(data: FaqRequest): Promise<FaqResponse> {
    const response = await apiClient.post("/admin/faqs", data);
    return response.data;
  }

  async updateFaq(id: string, data: FaqRequest): Promise<FaqResponse> {
    const response = await apiClient.put(`/admin/faqs/${id}`, data);
    return response.data;
  }

  async deleteFaq(id: string): Promise<void> {
    await apiClient.delete(`/admin/faqs/${id}`);
  }

  async getPublicFaqsByPage(pageType: string): Promise<FaqResponse[]> {
    const response = await apiClient.get(`/faqs/public?pageType=${pageType}`);
    return response.data;
  }
}

export const faqService = new FaqService();
