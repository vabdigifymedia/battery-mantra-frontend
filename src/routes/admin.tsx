import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminRoute } from "@/guards/AdminRoute";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminRoute>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50/80 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 shadow-xs">
              <img
                src="/red_flag.gif"
                alt="Flag"
                className="h-6 w-6 sm:h-7 sm:w-7 object-contain select-none pointer-events-none"
              />
              <span className="font-bold text-red-600 dark:text-red-500 tracking-wider text-sm sm:text-base select-none whitespace-nowrap">
                ॥ जय माता दी ॥
              </span>
            </div>

            <div className="w-7" />
          </header>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  );
}
