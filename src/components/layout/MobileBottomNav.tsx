import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Grid, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { cartQuery } from "@/queries";
import { useAuth } from "@/providers/AuthProvider";

const NAV_ITEMS = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Search, label: "Find Battery", to: "/vehicle-finder" },
  { icon: Grid, label: "Categories", to: "/products" },
  { icon: ShoppingCart, label: "Cart", to: "/cart", badge: true },
  { icon: User, label: "Account", to: "/account" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { status } = useAuth();
  const { data: cart } = useQuery(cartQuery(status === "authenticated"));
  const cartItemCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-t border-border/60 bg-background/80 px-2 pb-safe backdrop-blur-lg sm:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)]">
      {NAV_ITEMS.map(({ icon: Icon, label, to, badge }) => {
        const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
        
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors active:scale-95 duration-200",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-6 w-6", isActive && "fill-primary/20 stroke-[2.5]")} />
              {badge && cartItemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-background">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className={cn("text-[10px] font-medium leading-none", isActive && "font-semibold")}>
              {label}
            </span>
            {isActive && (
              <span className="absolute -top-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
