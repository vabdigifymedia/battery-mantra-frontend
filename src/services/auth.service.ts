import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, RefreshTokenRequest, RefreshTokenResponse, SendOtpRequest, VerifyOtpRequest } from "@/types/dto";

export const authService = {
  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>(endpoints.auth.login, { method: "POST", body, auth: false }),
  async register(req: RegisterRequest): Promise<RegisterResponse> {
    return apiFetch<RegisterResponse>(endpoints.auth.register, {
      method: "POST",
      body: req,
      auth: false,
    });
  },

  async refreshToken(req: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return apiFetch<RefreshTokenResponse>(endpoints.auth.refresh, {
      method: "POST",
      body: req,
      auth: false, // Don't send the expired access token here
    });
  },

  async sendOtp(req: SendOtpRequest): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(endpoints.auth.sendOtp, {
      method: "POST",
      body: req,
      auth: false,
    });
  },

  async verifyOtp(req: VerifyOtpRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>(endpoints.auth.verifyOtp, {
      method: "POST",
      body: req,
      auth: false,
    });
  },

  async checkUser(phoneNumber: string): Promise<{ exists: boolean; name: string | null }> {
    return apiFetch<{ exists: boolean; name: string | null }>(`${endpoints.auth.checkUser}?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      auth: false,
    });
  },
};
