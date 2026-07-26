import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  CreateQuotationRequest,
  CreateCorporateEnquiryRequest,
} from "@/types/dto";

export const enquiriesService = {
  createQuotation: (req: CreateQuotationRequest) =>
    apiFetch<void>(endpoints.enquiries.quotation, {
      method: "POST",
      body: req,
      auth: false,
    }),
  createCorporate: (req: CreateCorporateEnquiryRequest) =>
    apiFetch<void>(endpoints.enquiries.corporate, {
      method: "POST",
      body: req,
      auth: false,
    }),
};
