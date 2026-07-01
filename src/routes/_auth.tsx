import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/providers/AuthProvider";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { status } = useAuth();
  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") return <Navigate to="/" />;
  return (
    <Container size="sm" className="py-12 sm:py-16">
      <Outlet />
    </Container>
  );
}
