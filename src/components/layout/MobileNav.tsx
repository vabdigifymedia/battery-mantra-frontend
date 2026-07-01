import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/common/Logo";

type NavLink = { label: string; to: string };

export function MobileNav({
  open,
  onOpenChange,
  links = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links?: NavLink[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center">
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2 py-3">
          {links.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No navigation yet.</p>
          ) : (
            links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => onOpenChange(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                {l.label}
              </Link>
            ))
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
