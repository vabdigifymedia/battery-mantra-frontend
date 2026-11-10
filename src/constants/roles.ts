/**
 * Roles as defined by the Spring Boot backend (OpenAPI: RegisterRequest.role enum).
 */
export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  SUB_ADMIN: "SUB_ADMIN",
  ENGINEER: "ENGINEER",
  PARTNER: "PARTNER"
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
