import { calcDiscountPercent, formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type PriceProps = {
  value: number | string;
  mrp?: number | string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showDiscount?: boolean;
  className?: string;
};

const sizes = {
  sm: { price: "text-sm", mrp: "text-xs" },
  md: { price: "text-base", mrp: "text-sm" },
  lg: { price: "text-xl", mrp: "text-sm" },
  xl: { price: "text-3xl", mrp: "text-base" },
} as const;

export function Price({ value, mrp, size = "md", showDiscount = true, className }: PriceProps) {
  const v = typeof value === "string" ? Number(value) : value;
  const m = mrp == null ? null : typeof mrp === "string" ? Number(mrp) : mrp;
  const pct = m ? calcDiscountPercent(m, v) : 0;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold tracking-tight text-price", sizes[size].price)}>
        {formatCurrency(v)}
      </span>
      {m && m > v ? (
        <>
          <span className={cn("text-muted-foreground line-through", sizes[size].mrp)}>
            {formatCurrency(m)}
          </span>
          {showDiscount && pct > 0 ? (
            <span className={cn("font-semibold text-discount", sizes[size].mrp)}>{pct}% off</span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
