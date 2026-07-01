import { Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { APP } from "@/constants/app";
import { cn } from "@/lib/utils";

/**
 * Logo slot. Replace with official BatteryMantra SVG when provided.
 */
export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2 font-display text-lg font-bold text-foreground", className)}
      aria-label={APP.name}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Zap className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {withWordmark ? (
        <span className="tracking-tight">
          Battery<span className="text-primary">Mantra</span>
        </span>
      ) : null}
    </Link>
  );
}
