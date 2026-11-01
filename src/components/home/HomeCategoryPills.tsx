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

const ALL_CATEGORIES_LOGO =
  "https://res.cloudinary.com/xtijkslp/image/upload/v1793505701/battery-mantra/categories/fqrfxxqvtqghgnddwzeq.png";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

// Smart contextual fallback icons for categories with missing or broken icons
function FallbackCategoryIcon({ categoryName }: { categoryName: string }) {
  const name = categoryName.toLowerCase();

  if (name.includes("car")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <Car className="h-8 w-8 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("solar")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Sun className="h-8 w-8 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("lithium")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <BatteryCharging className="h-8 w-8 stroke-[1.8]" />
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
        <Truck className="h-8 w-8 stroke-[1.8]" />
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
        <Cpu className="h-8 w-8 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("accessories") || name.includes("part")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
        <Wrench className="h-8 w-8 stroke-[1.8]" />
      </div>
    );
  }
  if (name.includes("inverter")) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Zap className="h-8 w-8 stroke-[1.8]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Battery className="h-8 w-8 stroke-[1.8]" />
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
      <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-2xl border border-border/80 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-card dark:via-card dark:to-muted/20 p-1.5 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.04)] dark:shadow-none group-hover:border-primary/40 group-hover:shadow-md group-active:border-primary group-active:scale-95 transition-all duration-200 overflow-hidden">
        <CategoryIcon iconUrl={category.iconUrl} name={category.categoryName} />
      </div>
      <div className="h-[34px] w-full flex items-center justify-center">
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
      <div className="w-full bg-background border-b border-border/40 py-2.5 sm:hidden relative flex items-start">
        {/* Fixed All Categories Skeleton */}
        <div className="shrink-0 pl-3 pr-2 py-0.5 bg-background relative z-20 flex flex-col items-center">
          <div className="flex flex-col items-center gap-1.5 w-[80px] min-w-[80px]">
            <Skeleton className="h-[74px] w-[74px] rounded-2xl" />
            <div className="flex flex-col items-center gap-1 w-full pt-1">
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="self-stretch w-[1px] bg-gradient-to-b from-transparent via-border/80 to-transparent shrink-0 my-1.5" />

        {/* Sliding Skeletons */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex w-full items-start gap-2.5 overflow-x-auto no-scrollbar scrollbar-hide pl-2 pr-4 py-0.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 w-[82px] min-w-[82px] shrink-0">
                <Skeleton className="h-[74px] w-[74px] rounded-2xl" />
                <div className="flex flex-col items-center gap-1 w-full pt-1">
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const categoriesList = sorted.filter(
    (c) => !c.categoryName.toLowerCase().replace(/\s+/g, "").includes("allcat")
  );

  const fixedLinkClass =
    "group flex flex-col items-center gap-1.5 w-[80px] min-w-[80px] shrink-0 active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl select-none";

  const scrollLinkClass =
    "group flex flex-col items-center gap-1.5 w-[82px] min-w-[82px] shrink-0 snap-start active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl select-none";

  return (
    <div className="w-full bg-background border-b border-border/40 py-2.5 sm:hidden relative flex items-start">
      {/* 1. FIXED PINNED: All Categories */}
      <div className="shrink-0 pl-3 pr-2 py-0.5 bg-background relative z-20 flex flex-col items-center">
        <Link to="/categories" className={fixedLinkClass}>
          <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-2xl border-2 border-primary/25 bg-gradient-to-b from-primary/5 via-white to-slate-50/90 dark:from-card dark:via-card dark:to-muted/20 p-1.5 shadow-[0_2px_8px_-1px_rgba(220,38,38,0.12),0_1px_3px_-1px_rgba(0,0,0,0.04)] group-hover:border-primary/50 group-hover:shadow-md group-active:scale-95 transition-all duration-200 overflow-hidden">
            <img
              src={ALL_CATEGORIES_LOGO}
              alt="All Categories"
              className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="h-[34px] w-full flex items-center justify-center">
            <span className="text-[11px] font-bold text-center leading-[1.2] tracking-tight text-primary transition-colors line-clamp-2 px-0.5">
              All Categories
            </span>
          </div>
        </Link>
      </div>

      {/* Sleek Vertical Divider */}
      <div className="self-stretch w-[1px] bg-gradient-to-b from-transparent via-border/80 to-transparent shrink-0 my-1.5 shadow-[1px_0_3px_rgba(0,0,0,0.04)]" />

      {/* 2. SCROLLABLE: Sliding Categories */}
      <div className="flex-1 min-w-0 relative">
        {/* Soft edge fade hints */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex w-full items-start gap-2.5 overflow-x-auto no-scrollbar scrollbar-hide pl-2 pr-4 scroll-px-2 snap-x snap-mandatory overscroll-x-contain py-0.5">
          {categoriesList.map((category) => {
            const rawSlug = category.categorySlug || toSlug(category.categoryName);
            const cardContent = <CategoryCardItem category={category} />;

            const isCar = /(^|\s)car(\s|$)/i.test(category.categoryName);
            if (isCar || category.clickAction === "SHOW_MANUFACTURERS") {
              return (
                <Link key={category.categoryId} to="/shop-by-manufacturers" className={scrollLinkClass}>
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
                <Link key={category.categoryId} to="/shop-by-category/$" params={{ _splat: targetSlug }} className={scrollLinkClass}>
                  {cardContent}
                </Link>
              );
            }

            if (category.clickAction === "SHOW_PRODUCTS") {
              return (
                <Link key={category.categoryId} to="/shop/c/$categorySlug" params={{ categorySlug: rawSlug }} className={scrollLinkClass}>
                  {cardContent}
                </Link>
              );
            }

            if (category.clickAction === "SHOW_SUBCATEGORIES" || (category.subCategories && category.subCategories.length > 0)) {
              return (
                <Link key={category.categoryId} to="/shop-by-category/$" params={{ _splat: rawSlug }} className={scrollLinkClass}>
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
                  className={scrollLinkClass}
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
                className={scrollLinkClass}
              >
                {cardContent}
              </Link>
            );
          })}

          {/* Trailing spacer ensures last category pill isn't flush with edge on full scroll */}
          <div className="w-2 shrink-0 pointer-events-none" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
