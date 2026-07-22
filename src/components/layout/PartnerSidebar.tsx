import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, Users, Package, Wallet, Store, LogOut, Package2 } from "lucide-react";
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
  { name: "Orders & Overview", href: "/partner", icon: LayoutDashboard },
  { name: "My Engineers", href: "/partner/engineers", icon: Users },
  { name: "Inventory", href: "/partner/inventory", icon: Package },
  { name: "Earnings & Payouts", href: "/partner/earnings", icon: Wallet },
  { name: "Store Profile", href: "/partner/profile", icon: Store },
];

export function PartnerSidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const router = useRouter();

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
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
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
