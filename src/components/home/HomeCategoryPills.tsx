import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery } from "@/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeCategoryPills() {
  const { data: categories, isLoading } = useQuery(rootCategoriesQuery());

  if (isLoading) {
    return (
      <div className="w-full bg-background border-b border-border/40 pb-5 pt-4 sm:hidden">
        <div className="flex w-full items-start gap-4 overflow-x-auto no-scrollbar scrollbar-hide px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[68px]">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full bg-background border-b border-border/40 pb-5 pt-4 sm:hidden">
      <div className="flex w-full items-start gap-4 overflow-x-auto no-scrollbar scrollbar-hide px-4 snap-x">
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            to="/products"
            search={{ categoryId: category.categoryId }}
            className="flex flex-col items-center gap-2 min-w-[68px] snap-start active:scale-95 transition-transform duration-200"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-white p-2 shadow-sm overflow-hidden relative">
              {category.iconUrl ? (
                <img 
                  src={category.iconUrl} 
                  alt={category.categoryName} 
                  className="h-full w-full object-contain mix-blend-multiply"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.webp';
                  }}
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{category.categoryName.charAt(0)}</span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight tracking-tight text-foreground line-clamp-1">
              {category.categoryName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
