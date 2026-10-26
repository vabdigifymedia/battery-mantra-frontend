import { createFileRoute, Outlet, Navigate, useSearch } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/providers/AuthProvider";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { status, user } = useAuth();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const redirect = search?.redirect;

  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") {
    const isAdmin = user?.roles.includes("ADMIN");
    const isPartner = user?.roles.includes("PARTNER");
    if (isAdmin) return <Navigate to="/kalkaji" replace />;
    if (isPartner) return <Navigate to="/kalkaji/partner" replace />;

    if (redirect) {
      const [path, query] = redirect.split("?");
      const params = query ? Object.fromEntries(new URLSearchParams(query)) : undefined;
      return <Navigate to={path as any} search={params as any} replace />;
    }

    return <Navigate to="/" replace />;
  }
  return (
    <Container size="sm" className="py-12 sm:py-16">
      <Outlet />
    </Container>
  );
}
