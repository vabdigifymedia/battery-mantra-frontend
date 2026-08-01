import { Link } from "@tanstack/react-router";
import { Car, Zap, Sun, Bike, Cpu, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_PILLS = [
  { name: "Car", icon: Car, color: "bg-blue-500/10 text-blue-600", to: "/products?category=car-batteries" },
  { name: "Inverter", icon: Zap, color: "bg-brand/10 text-brand", to: "/products?category=inverter-batteries" },
  { name: "2-Wheeler", icon: Bike, color: "bg-green-500/10 text-green-600", to: "/products?category=two-wheeler-batteries" },
  { name: "Solar", icon: Sun, color: "bg-orange-500/10 text-orange-600", to: "/products?category=solar-batteries" },
  { name: "E-Rickshaw", icon: Cpu, color: "bg-purple-500/10 text-purple-600", to: "/products?category=e-rickshaw-batteries" },
  { name: "Warranty", icon: ShieldCheck, color: "bg-slate-500/10 text-slate-600", to: "/warranty-registration" },
];

export function HomeCategoryPills() {
  return (
    <div className="w-full bg-background border-b border-border/40 pb-3 pt-4 sm:hidden">
      <div className="flex w-full items-start gap-4 overflow-x-auto no-scrollbar px-4 snap-x">
        {CATEGORY_PILLS.map((category) => (
          <Link
            key={category.name}
            to={category.to}
            className="flex flex-col items-center gap-2 min-w-[64px] snap-start active:scale-95 transition-transform duration-200"
          >
            <div className={cn("grid h-16 w-16 place-items-center rounded-2xl shadow-sm border border-border/50", category.color)}>
              <category.icon className="h-7 w-7" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight tracking-tight text-foreground">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
