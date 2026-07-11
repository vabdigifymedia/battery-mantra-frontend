import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, LogOut, Menu, Package, Search, ShoppingCart, User } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/common/Logo";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/forms/SearchBox";
import { MobileNav } from "./MobileNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
import { cartQuery } from "@/queries";
import { cn } from "@/lib/utils";

export type NavLink = { label: string; to: string };

const DEFAULT_LINKS: NavLink[] = [
  { label: "Shop", to: "/products" },
  { label: "Vehicle Finder", to: "/vehicle-finder" },
  { label: "About Us", to: "/about-us" },
];

export function Navbar({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { status, user, signOut, hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const cart = useQuery(cartQuery(status === "authenticated" && !isAdmin));
  const cartCount = (cart.data?.cartItems ?? []).reduce((s, it) => s + it.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate({ to: "/products", search: q ? { q } : {} });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-transparent bg-background/85 backdrop-blur transition-shadow",
        scrolled && "border-border shadow-sm",
      )}
    >
      <Container
        size="xl"
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3 sm:gap-6"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo />
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-foreground bg-muted" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <form onSubmit={onSearch} className="hidden min-w-0 lg:block">
          <SearchBox
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            containerClassName="max-w-2xl mx-auto"
          />
        </form>

        <nav aria-label="Account actions" className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Search"
            onClick={() => navigate({ to: "/products" })}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:inline-flex">
            <Heart className="h-5 w-5" />
          </Button>

          {status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate text-sm font-medium">{user.username ?? "Account"}</div>
                  {user.email ? (
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/orders">
                    <Package className="mr-2 h-4 w-4" /> My orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <User className="mr-2 h-4 w-4" /> Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cart">
                    <ShoppingCart className="mr-2 h-4 w-4" /> My cart
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign in"
              onClick={() => navigate({ to: "/login" })}
            >
              <User className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            className="relative"
            onClick={() => navigate({ to: "/cart" })}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Button>
        </nav>
      </Container>

      <div className="border-t border-border lg:hidden">
        <Container size="xl" className="py-2.5">
          <form onSubmit={onSearch}>
            <SearchBox
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
            />
          </form>
        </Container>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} links={links} />
    </header>
  );
}
