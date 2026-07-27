import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, Package2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";

const partnerNavigation = [
  { name: "Overview", href: "/partner", icon: LayoutDashboard },
  { name: "Assigned Orders", href: "/partner/orders", icon: ShoppingCart },
  { name: "My Engineers", href: "/partner/engineers", icon: Users },
  { name: "Products & Pricing", href: "/partner/products", icon: Package },
];

export function PartnerSidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const assignedOrdersQuery = useQuery({
    queryKey: ["partner", "sidebar-assigned-orders"],
    queryFn: () => partnerDashboardService.listAssignedOrders(),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const pendingAssignedOrdersCount = (assignedOrdersQuery.data || []).filter(
    (o) => o.orderStatus === "PENDING" || o.orderStatus === "CONFIRMED" || o.orderStatus === "PROCESSING"
  ).length;

  const handleSignOut = () => {
    signOut();
    router.navigate({ to: "/login" as any });
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b p-4">
        <Link to="/partner" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Package2 className="h-6 w-6" />
          <span>Partner Portal</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {partnerNavigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/partner" && pathname.startsWith(item.href));
                const isOrders = item.href === "/partner/orders";
                const badgeCount = isOrders ? pendingAssignedOrdersCount : 0;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href} className="flex items-center w-full">
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1 truncate">{item.name}</span>
                        {badgeCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="mb-2 px-2 text-xs text-muted-foreground truncate">
          Signed in as: <span className="font-medium text-foreground">{user?.username || "Partner"}</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
