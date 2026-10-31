import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Zap, ArrowUpRight, Wrench, BatteryCharging, Sun, Car, Truck } from "lucide-react";
import { rootCategoriesQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

// Smart contextual fallback icons for categories with missing or broken icons
function getCategoryFallbackIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("accessor") || n.includes("cable") || n.includes("terminal") || n.includes("wire") || n.includes("part")) {
    return Wrench;
  }
  if (n.includes("solar")) {
    return Sun;
  }
  if (n.includes("lithium")) {
    return BatteryCharging;
  }
  if (n.includes("car")) {
    return Car;
  }
  if (n.includes("truck") || n.includes("bus") || n.includes("tractor") || n.includes("commercial")) {
    return Truck;
  }
  return Zap;
}

export function CategoryGrid() {
  const { data, isLoading, isError } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError || !data || !Array.isArray(data) || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
      {sorted.map((c) => {
        const rawSlug = c.categorySlug || toSlug(c.categoryName);
        const FallbackIcon = getCategoryFallbackIcon(c.categoryName);

        const cardContent = (
          <div className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-brand/40 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer overflow-hidden h-full min-h-[160px] sm:min-h-[175px]">
            {/* Subtle Gradient Hover Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Corner Explore Arrow */}
            <ArrowUpRight className="absolute top-2.5 right-2.5 w-4 h-4 text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 opacity-0 sm:opacity-50 group-hover:opacity-100" />

            {/* Harmonized Icon Pod (Constrains & standardizes all icon sizes) */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/60 p-2.5 flex items-center justify-center group-hover:bg-red-50/60 group-hover:border-red-200/80 group-hover:scale-105 transition-all duration-300 shadow-2xs shrink-0">
              {c.iconUrl ? (
                <img
                  src={c.iconUrl}
                  alt={c.categoryName}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand">
                  <FallbackIcon className="w-8 h-8 stroke-[1.8] group-hover:scale-110 transition-transform duration-300" />
                </div>
              )}
            </div>

            {/* Category Title with uniform alignment */}
            <div className="relative z-10 mt-3 flex flex-col items-center justify-center w-full min-h-[2.5rem]">
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-brand transition-colors line-clamp-2 leading-snug tracking-tight px-1">
                {c.categoryName}
              </span>
            </div>

            {/* Subtle Hover Accent Pill */}
            <div className="w-0 group-hover:w-8 h-0.5 bg-brand rounded-full transition-all duration-300 mt-1" />
          </div>
        );

        const isCar = /(^|\s)car(\s|$)/i.test(c.categoryName);
        if (isCar || c.clickAction === 'SHOW_MANUFACTURERS') {
          return (
            <Link key={c.categoryId} to="/shop-by-manufacturers" className="block h-full">
              {cardContent}
            </Link>
          );
        }

        const isCategoryBrands =
          rawSlug === "inverter-battery" ||
          rawSlug === "generator-battery" ||
          rawSlug === "generator-batteries" ||
          c.clickAction === 'SHOW_BRANDS';

        if (isCategoryBrands) {
          const targetSlug = rawSlug === "generator-battery" ? "generator-batteries" : rawSlug;
          return (
            <Link key={c.categoryId} to="/shop-by-category/$" params={{ _splat: targetSlug }} className="block h-full">
              {cardContent}
            </Link>
          );
        }

        if (c.clickAction === 'SHOW_PRODUCTS') {
          return (
            <Link key={c.categoryId} to="/shop/c/$categorySlug" params={{ categorySlug: rawSlug }} className="block h-full">
              {cardContent}
            </Link>
          );
        }

        if (c.clickAction === 'SHOW_SUBCATEGORIES' || (c.subCategories && c.subCategories.length > 0)) {
          return (
            <Link key={c.categoryId} to="/shop-by-category/$" params={{ _splat: rawSlug }} className="block h-full">
              {cardContent}
            </Link>
          );
        }

        const isVehicle = (() => {
          const n = c.categoryName.toLowerCase();
          return n.includes("commercial") || n.includes("tractor") || n.includes("three wheeler") || n.includes("3 wheeler");
        })();

        if (isVehicle) {
          return (
            <Link
              key={c.categoryId}
              to="/manufacturers/$categorySlug"
              params={{ categorySlug: rawSlug }}
              className="block h-full"
            >
              {cardContent}
            </Link>
          );
        }

        return (
          <Link
            key={c.categoryId}
            to="/shop-by-category/$"
            params={{ _splat: rawSlug }}
            className="block h-full"
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}
