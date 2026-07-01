import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  onRemove?: () => void;
  variant?: "default" | "brand" | "outline";
  className?: string;
};

const variants = {
  default: "bg-muted text-foreground",
  brand: "bg-primary-soft text-primary",
  outline: "border border-border bg-transparent text-foreground",
} as const;

export function Chip({ children, onRemove, variant = "default", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}
