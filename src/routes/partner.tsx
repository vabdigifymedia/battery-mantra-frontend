import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminRoute } from "@/guards/AdminRoute";
import { ROLES } from "@/constants/roles";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { PartnerSidebar } from "@/components/layout/PartnerSidebar";

export const Route = createFileRoute("/partner")({
  component: PartnerLayout,
});

function PartnerLayout() {
  return (
    <AdminRoute roles={[ROLES.PARTNER]} redirectTo="/login">
      <SidebarProvider>
        <PartnerSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex-1 font-semibold text-sm">
              Partner Workspace
            </div>
          </header>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  );
}
