import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
const sizeMap: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-12 w-12 border-[3px]",
};

export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: {
  size?: Size;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-r-transparent text-primary",
        sizeMap[size],
        className,
      )}
    />
  );
}
