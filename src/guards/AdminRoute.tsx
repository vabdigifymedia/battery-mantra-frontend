import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ROLES, type Role } from "@/constants/roles";
import { useAuth } from "@/providers/AuthProvider";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

/** Role-gated route. Defaults to ADMIN; pass `roles` to extend. */
export function AdminRoute({
  children,
  roles = [ROLES.ADMIN],
  redirectTo = "/",
}: {
  children: ReactNode;
  roles?: Role[];
  redirectTo?: string;
}) {
  const { status, user } = useAuth();
  if (status === "loading") return <FullPageLoader />;
  if (status === "unauthenticated") return <Navigate to={redirectTo} />;
  const ok = user?.roles.some((r) => roles.includes(r));
  if (!ok) return <Navigate to={redirectTo} />;
  return <>{children}</>;
}
