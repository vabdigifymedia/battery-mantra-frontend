import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cn, toSlug } from "@/lib/utils";
import { featuredBrandsQuery, brandsQuery, rootCategoriesQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { Image } from "@/components/common/Image";
import { ArrowRight } from "lucide-react";

export function BrandStrip() {
  const featured = useQuery(featuredBrandsQuery());
  const all = useQuery(brandsQuery());
  const cats = useQuery(rootCategoriesQuery());

  const featuredList = Array.isArray(featured.data) ? featured.data : [];
  const allList = Array.isArray(all.data) ? all.data : [];

  const hasFeatured = featuredList.length > 0;
  const isLoading = featured.isLoading || (!hasFeatured && all.isLoading);
  const data = (hasFeatured ? featuredList : allList).filter(b => b.productCount === undefined || b.productCount > 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }
  const batteryCatIds = cats.data
    ?.filter(c => {
      const name = c.categoryName.toLowerCase();
      if (name === "inverter" || name === "inverters" || name === "solar") return false;
      return true;
    })
    .map(c => c.categoryId) || [];

  if (data.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {data.map((b) => (
        <Link
          key={b.brandId}
          to="/brand/$brandSlug"
          params={{ brandSlug: toSlug(b.brandName) }}
          search={batteryCatIds.length > 0 ? { categoryId: batteryCatIds } : undefined}
          className="group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        >
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="relative flex h-12 w-full items-center justify-center sm:h-14">
            {b.brandLogo ? (
              <Image
                src={b.brandLogo}
                alt={b.brandName}
                aspect="auto"
                rounded={false}
                className="h-full w-full bg-transparent object-contain"
              />
            ) : (
              <span className="font-display text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {b.brandName}
              </span>
            )}
          </div>

          {/* Brand name below logo */}
          {b.brandLogo && (
            <span className="relative text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
              {b.brandName}
            </span>
          )}

          {/* Arrow indicator */}
          <ArrowRight className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-primary/60 group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
