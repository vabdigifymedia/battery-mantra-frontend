import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { AdminRoute } from "@/guards/AdminRoute";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/providers/AuthProvider";
import { LogOut, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner")({
  component: PartnerLayout,
});

function PartnerLayout() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.navigate({ to: "/login" as any });
  };

  return (
    <AdminRoute roles={[ROLES.PARTNER]} redirectTo="/login">
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
          <Link to="/partner" className="flex items-center gap-2 font-semibold md:text-lg">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block">Partner Dashboard</span>
          </Link>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </AdminRoute>
  );
}
