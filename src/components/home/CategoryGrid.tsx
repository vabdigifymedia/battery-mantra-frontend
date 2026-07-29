import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
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
  if (isError || !data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 lg:snap-none">
      {sorted.map((c) => {
        const name = c.categoryName.toLowerCase();
        const isCar = name.includes("car");
        const isBike = name.includes("bike") || name.includes("two wheeler") || name.includes("2 wheeler");

        const rawSlug = c.categorySlug || toSlug(c.categoryName);

        const cardContent = (
          <>
            <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
              {c.iconUrl ? (
                <img src={c.iconUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" />
              ) : (
                <Layers className="h-8 w-8" />
              )}
            </span>
            <span className="text-sm font-medium text-foreground line-clamp-2">
              {c.categoryName}
            </span>
          </>
        );

        const cardClassName = "group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-product min-w-[120px] snap-start lg:min-w-0";

        if (c.subCategories && c.subCategories.length > 0) {
          return (
            <Link
              key={c.categoryId}
              to="/categories/$categorySlug"
              params={{ categorySlug: rawSlug }}
              className={cardClassName}
            >
              {cardContent}
            </Link>
          );
        }

        if (isCar || isBike) {
          const categorySlug = isCar
            ? (rawSlug.includes("car") ? rawSlug : "car-batteries")
            : (rawSlug.includes("bike") || rawSlug.includes("two-wheeler") ? rawSlug : "two-wheeler-batteries");

          return (
            <Link
              key={c.categoryId}
              to="/manufacturers/$categorySlug"
              params={{ categorySlug }}
              className={cardClassName}
            >
              {cardContent}
            </Link>
          );
        }

        return (
          <Link
            key={c.categoryId}
            to="/products"
            search={{ categoryId: c.categoryId }}
            className={cardClassName}
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}
