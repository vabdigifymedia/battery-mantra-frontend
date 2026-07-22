import { Link, useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import {
  ShoppingBag,
  Car,
  Info,
  Phone,
  Mail,
  User,
  LogOut,
  Package,
  ShoppingCart,
  Settings,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";

type NavLink = { label: string; to: string };

const SOCIALS = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Twitter", href: "#", Icon: Twitter },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "YouTube", href: "#", Icon: Youtube },
];

const getIcon = (label: string) => {
  switch (label.toLowerCase()) {
    case "shop":
      return <ShoppingBag className="h-5 w-5" />;
    case "vehicle finder":
      return <Car className="h-5 w-5" />;
    case "about us":
      return <Info className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

export function MobileNav({
  open,
  onOpenChange,
  links = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links?: NavLink[];
}) {
  const { status, user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const isAdmin = hasRole("ADMIN");
  const isPartner = hasRole("PARTNER");
  const isEngineer = hasRole("ENGINEER");
  
  const shouldFetchCart = status === "authenticated" && !isAdmin && !isPartner && !isEngineer;
  const cart = useQuery(cartQuery(shouldFetchCart));
  const cartCount = (cart.data?.cartItems ?? []).reduce((s, it) => s + it.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col h-full bg-background border-r border-border">
        {/* Header Section */}
        <SheetHeader className="border-b border-border px-5 py-4 shrink-0 bg-background">
          <SheetTitle className="flex items-center">
            <Logo />
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {/* Main Navigation Links */}
          <nav className="flex flex-col px-3 py-4 space-y-1">
            {links.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No navigation yet.</p>
            ) : (
              links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center rounded-xl px-4 py-3.5 text-base font-medium text-foreground transition-all duration-200 hover:bg-muted hover:translate-x-1"
                  activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/15 font-semibold" }}
                >
                  <span className="mr-3.5 text-muted-foreground">{getIcon(l.label)}</span>
                  {l.label}
                </Link>
              ))
            )}
          </nav>

          {/* Account/Authentication section */}
          <div className="px-5 py-6">
            {status === "authenticated" && user ? (
              <div className="space-y-4">
                {/* User info card */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-surface border border-border p-4 shadow-sm">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-base">
                    {(user.username ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {user.username ?? "Account"}
                    </div>
                    {user.email && (
                      <div className="truncate text-xs text-muted-foreground mt-0.5">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Navigation Links */}
                <div className="flex flex-col space-y-1">
                  <Link
                    to="/orders"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
                    activeProps={{ className: "bg-primary/10 text-primary" }}
                  >
                    <Package className="mr-3 h-4.5 w-4.5 text-muted-foreground" />
                    My Orders
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
                    activeProps={{ className: "bg-primary/10 text-primary" }}
                  >
                    <Settings className="mr-3 h-4.5 w-4.5 text-muted-foreground" />
                    Account Settings
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
                    activeProps={{ className: "bg-primary/10 text-primary" }}
                  >
                    <ShoppingCart className="mr-3 h-4.5 w-4.5 text-muted-foreground" />
                    My Cart
                  </Link>
                  
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      signOut();
                    }}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 mt-2 text-left"
                  >
                    <LogOut className="mr-3 h-4.5 w-4.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
                  <h4 className="text-sm font-semibold text-foreground">Welcome to Battery Mantra</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Sign in to track orders, access your cart, and enjoy special discount deals on batteries!
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="brand"
                    className="w-full justify-center h-11 text-sm font-medium rounded-xl shadow-sm"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/login" });
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-center h-11 text-sm font-medium rounded-xl"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/register" });
                    }}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Support Section */}
          <div className="px-5 py-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground px-1">
              Support & Inquiries
            </h4>
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-sm">
              <a
                href="tel:09200920051"
                className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Call Us Directly</div>
                  <div className="text-sm font-bold">09200920051</div>
                </div>
              </a>

              <div className="flex items-center gap-3 text-foreground">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email Support</div>
                  <div className="text-sm font-medium">support@batterymantra.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer/Social Links at bottom */}
        <div className="border-t border-border bg-surface/50 px-5 py-4 shrink-0 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Battery Mantra
          </div>
          <div className="flex items-center gap-1.5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
