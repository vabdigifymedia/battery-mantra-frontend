import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const sizes = {
  sm: { btn: "h-7 w-7", val: "w-8 text-sm", icon: "h-3.5 w-3.5" },
  md: { btn: "h-9 w-9", val: "w-10 text-base", icon: "h-4 w-4" },
} as const;

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "md",
  className,
}: QuantityStepperProps) {
  const s = sizes[size];
  const dec = () => !disabled && value > min && onChange(value - 1);
  const inc = () => !disabled && value < max && onChange(value + 1);

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-surface",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={cn("grid place-items-center rounded-l-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50", s.btn)}
      >
        <Minus className={s.icon} />
      </button>
      <span className={cn("text-center font-semibold tabular-nums", s.val)} aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={cn("grid place-items-center rounded-r-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50", s.btn)}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
}
