import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  CreateRazorpayOrderRequest,
  RazorpayOrderResponse,
  VerifyPaymentRequest,
  PaymentVerificationResponse,
} from "@/types/dto";

export const paymentsService = {
  createRazorpayOrder: (body: CreateRazorpayOrderRequest, signal?: AbortSignal) =>
    apiFetch<RazorpayOrderResponse>(endpoints.payments.razorpay.createOrder, {
      method: "POST",
      body,
      signal,
    }),
  verifyPayment: (body: VerifyPaymentRequest, signal?: AbortSignal) =>
    apiFetch<PaymentVerificationResponse>(endpoints.payments.razorpay.verify, {
      method: "POST",
      body,
      signal,
    }),
};
