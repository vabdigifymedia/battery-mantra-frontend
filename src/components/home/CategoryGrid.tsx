import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Zap, Wrench, BatteryCharging, Sun, Car, Truck } from "lucide-react";
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

const ALL_CATEGORIES_LOGO =
  "https://res.cloudinary.com/xtijkslp/image/upload/v1793505701/battery-mantra/categories/fqrfxxqvtqghgnddwzeq.png";

export function CategoryGrid() {
  const { data, isLoading, isError } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36 sm:h-44 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError || !data || !Array.isArray(data) || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const categoriesList = sorted.filter(
    (c) => !c.categoryName.toLowerCase().replace(/\s+/g, "").includes("allcat")
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {/* All Categories Card - First Position */}
      <Link to="/categories" className="block h-full">
        <div className="group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-brand/40 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer overflow-hidden h-full min-h-[130px] sm:min-h-[152px]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-center p-2 sm:p-2.5 group-hover:bg-red-50/60 group-hover:border-red-100 transition-colors shrink-0">
            <img
              src={ALL_CATEGORIES_LOGO}
              alt="All Categories"
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300 drop-shadow-xs"
              loading="lazy"
            />
          </div>
          <span className="text-xs sm:text-[13px] font-semibold text-slate-800 group-hover:text-brand transition-colors line-clamp-2 leading-snug mt-2.5 px-1">
            All Categories
          </span>
        </div>
      </Link>

      {categoriesList.map((c) => {
        const rawSlug = c.categorySlug || toSlug(c.categoryName);
        const FallbackIcon = getCategoryFallbackIcon(c.categoryName);

        const cardContent = (
          <div className="group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-brand/40 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer overflow-hidden h-full min-h-[130px] sm:min-h-[152px]">
            {/* Prominent Category Icon Pod */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-center p-2 sm:p-2.5 group-hover:bg-red-50/60 group-hover:border-red-100 transition-colors shrink-0">
              {c.iconUrl ? (
                <img
                  src={c.iconUrl}
                  alt={c.categoryName}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300 drop-shadow-xs"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand">
                  <FallbackIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 stroke-[1.8] group-hover:scale-110 transition-transform duration-200" />
                </div>
              )}
            </div>

            {/* Category Title */}
            <span className="text-xs sm:text-[13px] font-semibold text-slate-800 group-hover:text-brand transition-colors line-clamp-2 leading-snug mt-2.5 px-1">
              {c.categoryName}
            </span>
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
