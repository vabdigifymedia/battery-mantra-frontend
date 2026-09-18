import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Zap, Link as LinkIcon } from "lucide-react";
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { rootCategoriesQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

export function CategoryGrid() {
  const { data, isLoading, isError } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 lg:snap-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 min-w-[120px] lg:min-w-0 snap-start" />
        ))}
      </div>
    );
  }
  if (isError || !data || !Array.isArray(data) || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 lg:snap-none">
      {sorted.map((c) => {
        const rawSlug = c.categorySlug || toSlug(c.categoryName);

        const cardContent = (
          <GradientBlobCard className="flex flex-col items-center justify-center gap-3 p-4 text-center min-w-[140px] lg:min-w-0">
            <span className="grid h-20 w-20 place-items-center text-primary transition-transform group-hover:scale-110">
              {c.iconUrl ? (
                <img src={c.iconUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" />
              ) : (
                <Zap className="h-10 w-10 text-muted-foreground" />
              )}
            </span>
            <span className="text-sm font-medium text-foreground line-clamp-2 px-1">
              {c.categoryName}
            </span>
          </GradientBlobCard>
        );

        if (c.clickAction === 'SHOW_BRANDS') {
          return (
            <Link
              key={c.categoryId}
              to="/brands/$categorySlug"
              params={{ categorySlug: rawSlug }}
              className="snap-start"
            >
              {cardContent}
            </Link>
          );
        }
        if (c.clickAction === 'SHOW_MANUFACTURERS') {
          return (
            <Link key={c.categoryId} to="/manufacturers/$categorySlug" params={{ categorySlug: rawSlug }} className="snap-start">
              {cardContent}
            </Link>
          );
        }
        if (c.clickAction === 'SHOW_PRODUCTS') {
          return (
            <Link key={c.categoryId} to="/shop/c/$categorySlug" params={{ categorySlug: rawSlug }} className="snap-start">
              {cardContent}
            </Link>
          );
        }
        if (c.clickAction === 'SHOW_SUBCATEGORIES') {
          return (
            <Link key={c.categoryId} to="/shop-by-category/$categorySlug" params={{ categorySlug: rawSlug }} className="snap-start">
              {cardContent}
            </Link>
          );
        }

        // AUTO or undefined fallback
        if (c.subCategories && c.subCategories.length > 0) {
          return (
            <Link
              key={c.categoryId}
              to="/shop-by-category/$categorySlug"
              params={{ categorySlug: rawSlug }}
              className="snap-start"
            >
              {cardContent}
            </Link>
          );
        }

        const isVehicle = (() => {
          const n = c.categoryName.toLowerCase();
          return n.includes("car") || n.includes("commercial") || n.includes("tractor") || n.includes("three wheeler") || n.includes("3 wheeler");
        })();

        if (isVehicle) {
          return (
            <Link
              key={c.categoryId}
              to="/manufacturers/$categorySlug"
              params={{ categorySlug: rawSlug }}
              className="snap-start"
            >
              {cardContent}
            </Link>
          );
        }

        return (
          <Link
            key={c.categoryId}
            to="/brands/$categorySlug"
            params={{ categorySlug: rawSlug }}
            className="snap-start"
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}
