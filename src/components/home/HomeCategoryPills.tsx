import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery } from "@/queries";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Battery,
  BatteryCharging,
  Car,
  Cpu,
  Sun,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import type { CategoryListResponse } from "@/types/dto";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

// Smart contextual fallback icons for categories with missing or broken icons
function FallbackCategoryIcon({ categoryName }: { categoryName: string }) {
  const name = categoryName.toLowerCase();

  if (name.includes("car")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <Car className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("solar")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Sun className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("lithium")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <BatteryCharging className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }
  if (
    name.includes("truck") ||
    name.includes("bus") ||
    name.includes("commercial") ||
    name.includes("tractor") ||
    name.includes("wheeler")
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
        <Truck className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }
  if (
    name.includes("ups") ||
    name.includes("stabilizer") ||
    name.includes("computer")
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
        <Cpu className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("accessories") || name.includes("part")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
        <Wrench className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("inverter")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Zap className="h-6 w-6 stroke-[1.8]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Battery className="h-6 w-6 stroke-[1.8]" />
    </div>
  );
}

function CategoryIcon({ iconUrl, name }: { iconUrl?: string | null; name: string }) {
  const [imageError, setImageError] = useState(false);

  if (!iconUrl || imageError) {
    return <FallbackCategoryIcon categoryName={name} />;
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}

function CategoryCardItem({ category }: { category: CategoryListResponse }) {
  return (
    <>
      <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-border/80 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-card dark:via-card dark:to-muted/20 p-2 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.04)] dark:shadow-none group-hover:border-primary/40 group-hover:shadow-md group-active:border-primary group-active:scale-95 transition-all duration-200 overflow-hidden">
        <CategoryIcon iconUrl={category.iconUrl} name={category.categoryName} />
      </div>
      <div className="h-8 w-full flex items-center justify-center">
        <span className="text-[11px] font-semibold text-center leading-[1.25] tracking-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 px-0.5">
          {category.categoryName}
        </span>
      </div>
    </>
  );
}

export function HomeCategoryPills() {
  const { data: categories, isLoading } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="w-full bg-background border-b border-border/40 py-2.5 sm:hidden relative">
        <div className="flex w-full items-start gap-2.5 overflow-x-auto no-scrollbar scrollbar-hide px-4 scroll-px-4 py-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 w-[72px] min-w-[72px] shrink-0">
              <Skeleton className="h-[60px] w-[60px] rounded-2xl" />
              <div className="flex flex-col items-center gap-1 w-full pt-0.5">
                <Skeleton className="h-2.5 w-12 rounded-full" />
                <Skeleton className="h-2 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const linkClass =
    "group flex flex-col items-center gap-1.5 w-[72px] min-w-[72px] shrink-0 snap-start active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl select-none";

  return (
    <div className="w-full bg-background border-b border-border/40 py-2.5 sm:hidden relative">
      {/* Subtle edge fade hints */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex w-full items-start gap-2.5 overflow-x-auto no-scrollbar scrollbar-hide px-4 scroll-px-4 snap-x snap-mandatory overscroll-x-contain py-1">
        {sorted.map((category) => {
          const rawSlug = category.categorySlug || toSlug(category.categoryName);
          const cardContent = <CategoryCardItem category={category} />;

          const isCar = /(^|\s)car(\s|$)/i.test(category.categoryName);
          if (isCar || category.clickAction === "SHOW_MANUFACTURERS") {
            return (
              <Link key={category.categoryId} to="/shop-by-manufacturers" className={linkClass}>
                {cardContent}
              </Link>
            );
          }

          const isCategoryBrands =
            rawSlug === "inverter-battery" ||
            rawSlug === "generator-battery" ||
            rawSlug === "generator-batteries" ||
            category.clickAction === "SHOW_BRANDS";

          if (isCategoryBrands) {
            const targetSlug = rawSlug === "generator-battery" ? "generator-batteries" : rawSlug;
            return (
              <Link key={category.categoryId} to="/shop-by-category/$" params={{ _splat: targetSlug }} className={linkClass}>
                {cardContent}
              </Link>
            );
          }

          if (category.clickAction === "SHOW_PRODUCTS") {
            return (
              <Link key={category.categoryId} to="/shop/c/$categorySlug" params={{ categorySlug: rawSlug }} className={linkClass}>
                {cardContent}
              </Link>
            );
          }

          if (category.clickAction === "SHOW_SUBCATEGORIES" || (category.subCategories && category.subCategories.length > 0)) {
            return (
              <Link key={category.categoryId} to="/shop-by-category/$" params={{ _splat: rawSlug }} className={linkClass}>
                {cardContent}
              </Link>
            );
          }

          const isVehicle = (() => {
            const n = category.categoryName.toLowerCase();
            return (
              n.includes("commercial") ||
              n.includes("tractor") ||
              n.includes("three wheeler") ||
              n.includes("3 wheeler")
            );
          })();

          if (isVehicle) {
            return (
              <Link
                key={category.categoryId}
                to="/manufacturers/$categorySlug"
                params={{ categorySlug: rawSlug }}
                className={linkClass}
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <Link
              key={category.categoryId}
              to="/shop-by-category/$"
              params={{ _splat: rawSlug }}
              className={linkClass}
            >
              {cardContent}
            </Link>
          );
        })}

        {/* Trailing spacer ensures last category pill isn't flush with edge on full scroll */}
        <div className="w-2 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
}
