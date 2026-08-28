import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { env } from "@/lib/utils/env";
import { LayoutDashboard, Users, ShoppingCart, Package, LogOut, Layers, Tag, Car, Image, PhoneCall, MapPin, Truck, Fuel, Battery, Factory, Percent, Globe, FileText, HelpCircle, MessageSquare, ClipboardList, Ticket, ArrowUpDown, CalendarRange } from "lucide-react";
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
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "Locations", href: "/admin/locations", icon: MapPin },
  { name: "Delivery Time", href: "/admin/delivery-time", icon: Truck },
  { name: "CMS Pages", href: "/admin/pages", icon: FileText },
  { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Engineers", href: "/admin/engineers", icon: Users },
  { name: "Leave Requests", href: "/admin/leaves", icon: CalendarRange },
  { name: "Partners", href: "/admin/partners", icon: Users },
  { name: "Banners", href: "/admin/banners", icon: Image },
  { name: "Callbacks", href: "/admin/callbacks", icon: PhoneCall },
  { name: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
];

const productNavigation = [
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Product Priority", href: "/admin/products/priority", icon: ArrowUpDown },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Specifications", href: "/admin/specifications", icon: ClipboardList },
  { name: "Vehicles", href: "/admin/vehicles", icon: Car },
  { name: "Fuels", href: "/admin/fuels", icon: Fuel },
  { name: "R/L Codes", href: "/admin/capacities", icon: Battery },
  { name: "Manufacturers", href: "/admin/manufacturers", icon: Factory },
  { name: "Pricing %", href: "/admin/bulk-pricing", icon: Percent },
  { name: "Price Value", href: "/admin/quick-edit", icon: Percent },
];

const seoNavigation = [
  { name: "SEO Pages", href: "/admin/seo/pages", icon: Globe },
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
  const router = useRouter();

  // Queries for Notification Badges (Sharing exact queryKeys with pages for instant real-time invalidation)
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminService.getAllOrders(),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const callbacksQuery = useQuery({
    queryKey: ["admin", "callbacks"],
    queryFn: () => adminService.getAllCallbacks(),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const enquiriesQuery = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: () => adminService.getAllEnquiries(),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const pendingProductsQuery = useQuery({
    queryKey: ["admin", "products", "pending"],
    queryFn: () => adminService.getPendingProducts(),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const newOrdersCount = ordersQuery.data?.filter(
    (o) => o.orderStatus === "PENDING" || o.orderStatus === "CONFIRMED" || o.orderStatus === "PROCESSING"
  ).length || 0;

  const pendingCallbacksCount = callbacksQuery.data?.filter(
    (c) => c.status === "PENDING"
  ).length || 0;

  const pendingEnquiriesCount = enquiriesQuery.data?.filter(
    (e) => e.status === "PENDING" || e.status === "IN_PROGRESS"
  ).length || 0;

  const pendingProductsCount = pendingProductsQuery.data?.length || 0;

  const getBadgeCount = (href: string) => {
    if (href === "/admin/orders") return newOrdersCount;
    if (href === "/admin/callbacks") return pendingCallbacksCount;
    if (href === "/admin/enquiries") return pendingEnquiriesCount;
    if (href === "/admin/products") return pendingProductsCount;
    return 0;
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4">
        <Link to="/admin" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary">
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
                const badgeCount = getBadgeCount(item.href);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href} className="flex items-center w-full">
                        <item.icon />
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

        <SidebarGroup>
          <SidebarGroupLabel>Catalog</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible-catalog">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Catalog">
                      <Package />
                      <span>Product Management</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible-catalog:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {productNavigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        const badgeCount = getBadgeCount(item.href);
                        return (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link to={item.href}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                                {badgeCount > 0 && (
                                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm">
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
            <SidebarMenuButton onClick={() => { signOut(); router.navigate({ to: "/login" as any }); }} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
