import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/providers/AuthProvider";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { status, user } = useAuth();
  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") {
    const isAdmin = user?.roles.includes("ADMIN");
    return <Navigate to={isAdmin ? "/admin" : "/"} />;
  }
  return (
    <Container size="sm" className="py-12 sm:py-16">
      <Outlet />
    </Container>
  );
}
