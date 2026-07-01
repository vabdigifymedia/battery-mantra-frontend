import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { rootCategoriesQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";

export function CategoryGrid() {
  const { data, isLoading, isError } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (isError || !data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {sorted.map((c) => (
        <Link
          key={c.categoryId}
          to="/products"
          search={{ categoryId: c.categoryId }}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-product"
        >
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
        </Link>
      ))}
    </div>
  );
}
