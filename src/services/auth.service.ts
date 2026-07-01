import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/types/dto";

export const authService = {
  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>(endpoints.auth.login, { method: "POST", body, auth: false }),
  register: (body: RegisterRequest) =>
    apiFetch<RegisterResponse>(endpoints.auth.register, { method: "POST", body, auth: false }),
};
