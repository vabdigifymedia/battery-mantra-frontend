import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery } from "@/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

// Category badge helper for app-like visual cues
const getCategoryBadge = (name: string): { label: string; className: string } | null => {
  const n = name.toLowerCase();
  if (n.includes("car")) return { label: "Fastest", className: "bg-red-50 text-red-600 border border-red-200/60" };
  if (n.includes("inverter")) return { label: "Offers", className: "bg-blue-50 text-blue-600 border border-blue-200/60" };
  if (n.includes("lithium")) return { label: "New Gen", className: "bg-purple-50 text-purple-600 border border-purple-200/60" };
  if (n.includes("solar")) return { label: "Subsidy", className: "bg-amber-50 text-amber-700 border border-amber-200/60" };
  if (n.includes("commercial") || n.includes("tractor")) return { label: "Heavy", className: "bg-slate-100 text-slate-700 border border-slate-200" };
  if (n.includes("two wheeler") || n.includes("2-wheeler") || n.includes("bike")) return { label: "Express", className: "bg-emerald-50 text-emerald-700 border border-emerald-200/60" };
  return null;
};

export function HomeCategoryPills() {
  const { data: categories, isLoading } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="w-full bg-background border-b border-border/40 pb-4 pt-3 sm:hidden">
        <div className="flex items-center justify-between px-4 mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex w-full items-start gap-3 overflow-x-auto no-scrollbar scrollbar-hide px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-[74px]">
              <Skeleton className="h-[66px] w-[66px] rounded-2xl" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="w-full bg-background border-b border-border/40 pb-3 pt-3 sm:hidden">
      {/* Header Row */}
      <div className="flex items-center justify-between px-4 mb-2.5">
        <span className="text-[12px] font-extrabold tracking-wide text-gray-900 uppercase">
          Browse Solutions
        </span>
        <Link
          to="/categories"
          className="text-[11px] font-bold text-primary flex items-center gap-0.5 active:opacity-75 transition-opacity"
        >
          <span>All Categories ({categories.length})</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {/* Horizontal Tray */}
      <div className="flex w-full items-start gap-3 overflow-x-auto no-scrollbar scrollbar-hide px-4 snap-x">
        {sorted.map((category) => {
          const rawSlug = category.categorySlug || toSlug(category.categoryName);
          const badge = getCategoryBadge(category.categoryName);

          const cardContent = (
            <>
              <div className="relative w-[66px] h-[66px] rounded-2xl bg-gradient-to-b from-white to-gray-50/90 border border-gray-100/90 shadow-2xs flex items-center justify-center p-2.5 group-active:scale-95 transition-transform overflow-visible">
                {badge && (
                  <span
                    className={`absolute -top-1.5 -right-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs z-10 uppercase tracking-tighter ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
                {category.iconUrl ? (
                  <img
                    src={category.iconUrl}
                    alt={category.categoryName}
                    className="h-full w-full object-contain mix-blend-multiply drop-shadow-2xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.webp";
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-primary/70">{category.categoryName.charAt(0)}</span>
                )}
              </div>
              <span className="text-[11px] font-bold text-center leading-[1.25] text-gray-800 line-clamp-2 h-[28px] flex items-center justify-center px-0.5 mt-1 tracking-tight">
                {category.categoryName}
              </span>
            </>
          );

          const linkClass = "flex flex-col items-center shrink-0 w-[74px] text-center snap-start active:scale-95 transition-transform duration-200";

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
              <Link
                key={category.categoryId}
                to="/shop-by-category/$"
                params={{ _splat: targetSlug }}
                className={linkClass}
              >
                {cardContent}
              </Link>
            );
          }

          if (category.clickAction === "SHOW_PRODUCTS") {
            return (
              <Link
                key={category.categoryId}
                to="/shop/c/$categorySlug"
                params={{ categorySlug: rawSlug }}
                className={linkClass}
              >
                {cardContent}
              </Link>
            );
          }

          if (
            category.clickAction === "SHOW_SUBCATEGORIES" ||
            (category.subCategories && category.subCategories.length > 0)
          ) {
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
      </div>
    </div>
  );
}
