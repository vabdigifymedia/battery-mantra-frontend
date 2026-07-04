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
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={APP.name}
    >
      <img src="/logo.png" alt={APP.name} className="h-10 w-auto object-contain" />
    </Link>
  );
}
