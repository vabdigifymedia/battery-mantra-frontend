import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";

/** Inverse of ProtectedRoute — for login/signup. Redirects when already signed in. */
export function PublicRoute({
  children,
  redirectTo = "/",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { status } = useAuth();
  if (status === "authenticated") return <Navigate to={redirectTo} />;
  return <>{children}</>;
}
