import { Link, useLocation } from "@tanstack/react-router";
import { env } from "@/lib/utils/env";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Vehicles", href: "/admin/vehicles", icon: Car },
  { name: "Fuels", href: "/admin/fuels", icon: Layers },
  { name: "Capacities (RL)", href: "/admin/capacities", icon: Layers },
  { name: "Manufacturers", href: "/admin/manufacturers", icon: Layers },
  { name: "Locations", href: "/admin/locations", icon: MapPin },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Banners", href: "/admin/banners", icon: Image },
  { name: "Callbacks", href: "/admin/callbacks", icon: PhoneCall },
];

const seoNavigation = [
  { name: "SEO Pages", href: "/admin/seo/pages", icon: Layers },
  { name: "Google Products Feed", href: `${env.API_BASE_URL || 'http://localhost:8080'}/api/seo/google-feed.xml`, icon: Package, external: true },
];

const seoQuickNavigation = [
  { name: "Brands", href: "/admin/seo/quick/brands" },
  { name: "Manufacturers", href: "/admin/seo/quick/manufacturers" },
  { name: "Categories", href: "/admin/seo/quick/categories" },
  { name: "Products", href: "/admin/seo/quick/products" },
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

        <SidebarGroup>
          <SidebarGroupLabel>SEO Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="SEO">
                      <Search />
                      <span>SEO Management</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {seoNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href);
                        return (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild isActive={isActive && !item.external}>
                              {item.external ? (
                                <a href={item.href} target="_blank" rel="noopener noreferrer">
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.name}</span>
                                </a>
                              ) : (
                                <Link to={item.href}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.name}</span>
                                </Link>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}

                      {/* Nested Collapsible for SEO Quick */}
                      <Collapsible className="group/collapsible-quick">
                        <SidebarMenuSubItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuSubButton>
                              <Tag className="h-4 w-4" />
                              <span>SEO Quick</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible-quick:rotate-90" />
                            </SidebarMenuSubButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {seoQuickNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                  <SidebarMenuSubItem key={item.name}>
                                    <SidebarMenuSubButton asChild isActive={isActive}>
                                      <Link to={item.href}>
                                        <span>{item.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuSubItem>
                      </Collapsible>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
