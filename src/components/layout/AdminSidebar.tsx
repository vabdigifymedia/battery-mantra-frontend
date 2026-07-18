import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, ShoppingCart, Package, LogOut, Layers, Tag, Car, Image, PhoneCall, MapPin } from "lucide-react";
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

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Vehicles", href: "/admin/vehicles", icon: Car },
  { name: "Capacities (RL)", href: "/admin/capacities", icon: Layers },
  { name: "Manufacturers", href: "/admin/manufacturers", icon: Layers },
  { name: "Locations", href: "/admin/locations", icon: MapPin },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Banners", href: "/admin/banners", icon: Image },
  { name: "Callbacks", href: "/admin/callbacks", icon: PhoneCall },
];

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary">
          BatteryMantra
          <span className="text-xs font-normal text-muted-foreground uppercase tracking-widest ml-2">Admin</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href}>
                        <item.icon />
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

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
