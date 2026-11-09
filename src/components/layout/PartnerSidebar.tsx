import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, Package2, KeyRound, Boxes } from "lucide-react";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
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
import { useNewOrderAlert } from "@/hooks/useNewOrderAlert";

const partnerNavigation = [
  { name: "Overview", href: "/kalkaji/partner", icon: LayoutDashboard },
  { name: "Assigned Orders", href: "/kalkaji/partner/orders", icon: ShoppingCart },
  { name: "My Engineers", href: "/kalkaji/partner/engineers", icon: Users },
  { name: "Products & Pricing", href: "/kalkaji/partner/products", icon: Package },
  { name: "Branch Inventory", href: "/kalkaji/partner/inventory", icon: Boxes },
];

export function PartnerSidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const assignedOrdersQuery = useQuery({
    queryKey: ["partner", "orders"],
    queryFn: () => partnerDashboardService.listAssignedOrders(),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const orders = assignedOrdersQuery.data || [];

  const pendingAssignedOrdersCount = orders.filter(
    (o) => o.orderStatus === "PENDING" || o.orderStatus === "CONFIRMED" || o.orderStatus === "PROCESSING"
  ).length;

  // ── New-order audio & toast notifications ──────────────────────────
  useNewOrderAlert(orders);

  // ── Pulsing badge animation when pending count increases ──────────
  const prevCount = useRef(pendingAssignedOrdersCount);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (pendingAssignedOrdersCount > prevCount.current) {
      setIsPulsing(true);
      // Stop the pulse after 3 iterations × 0.6 s = 1.8 s
      const timer = setTimeout(() => setIsPulsing(false), 1800);
      return () => clearTimeout(timer);
    }
    prevCount.current = pendingAssignedOrdersCount;
  }, [pendingAssignedOrdersCount]);

  // Update prevCount after pulse ends so next increase re-triggers
  useEffect(() => {
    if (!isPulsing) {
      prevCount.current = pendingAssignedOrdersCount;
    }
  }, [isPulsing, pendingAssignedOrdersCount]);

  const handleSignOut = () => {
    signOut();
    router.navigate({ to: "/login" as any });
  };

  return (
    <Sidebar variant="inset">
      {/* Inject keyframes once */}
      <style>{`
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary), 0.4); }
          50% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(var(--primary), 0); }
        }
      `}</style>

      <SidebarHeader className="border-b p-4">
        <Link to="/kalkaji/partner" className="flex items-center gap-2 font-bold text-lg text-primary">
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
                const isActive = pathname === item.href || (item.href !== "/kalkaji/partner" && pathname.startsWith(item.href));
                const isOrders = item.href === "/kalkaji/partner/orders";
                const badgeCount = isOrders ? pendingAssignedOrdersCount : 0;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href} className="flex items-center w-full">
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1 truncate">{item.name}</span>
                        {badgeCount > 0 && (
                          <span
                            className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm"
                            style={
                              isOrders && isPulsing
                                ? { animation: "pulse-badge 0.6s ease-in-out 3" }
                                : undefined
                            }
                          >
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

      <SidebarFooter className="p-4 border-t space-y-1">
        <div className="mb-2 px-2 text-xs text-muted-foreground truncate">
          Signed in as: <span className="font-medium text-foreground">{user?.username || "Partner"}</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setChangePasswordOpen(true)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <KeyRound className="h-4 w-4" />
              <span>Change Password</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      </SidebarFooter>
    </Sidebar>
  );
}
