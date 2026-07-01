import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

/** Renders children only when authenticated. Redirects to `redirectTo` otherwise. */
export function ProtectedRoute({
  children,
  redirectTo = "/",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { status } = useAuth();
  if (status === "loading") return <FullPageLoader />;
  if (status === "unauthenticated") return <Navigate to={redirectTo} />;
  return <>{children}</>;
}
