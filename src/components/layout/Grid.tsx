import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Cols = 1 | 2 | 3 | 4 | 5 | 6;
type GridProps = {
  cols?: { base?: Cols; sm?: Cols; md?: Cols; lg?: Cols; xl?: Cols };
  gap?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
};

const colClass: Record<Cols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};
const bpClass = {
  sm: { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5", 6: "sm:grid-cols-6" },
  md: { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" },
  lg: { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" },
  xl: { 1: "xl:grid-cols-1", 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-6" },
} as const;

const gapClass = { sm: "gap-3", md: "gap-5", lg: "gap-8" };

export function Grid({ cols = { base: 1, sm: 2, lg: 3 }, gap = "md", className, children }: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        gapClass[gap],
        cols.base && colClass[cols.base],
        cols.sm && bpClass.sm[cols.sm],
        cols.md && bpClass.md[cols.md],
        cols.lg && bpClass.lg[cols.lg],
        cols.xl && bpClass.xl[cols.xl],
        className,
      )}
    >
      {children}
    </div>
  );
}
