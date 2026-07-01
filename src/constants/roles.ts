/**
 * Roles as defined by the Spring Boot backend (OpenAPI: RegisterRequest.role enum).
 * Backend exposes only ADMIN and CUSTOMER. ENGINEER is reserved for future use.
 */
export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  ENGINEER: "ENGINEER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
