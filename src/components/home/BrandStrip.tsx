import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { featuredBrandsQuery, brandsQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { Image } from "@/components/common/Image";

export function BrandStrip() {
  const featured = useQuery(featuredBrandsQuery());
  const all = useQuery(brandsQuery());

  const isLoading = featured.isLoading || (featured.isError && all.isLoading);
  const data =
    featured.data && featured.data.length > 0 ? featured.data : all.data ?? [];

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20 w-32 shrink-0" />
        ))}
      </div>
    );
  }
  if (data.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {data.map((b) => (
        <Link
          key={b.brandId}
          to="/products"
          search={{ brandId: b.brandId }}
          className="group flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-product"
        >
          {b.brandLogo ? (
            <Image
              src={b.brandLogo}
              alt={b.brandName}
              aspect="auto"
              rounded={false}
              className="h-10 w-full bg-transparent"
            />
          ) : (
            <span className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
              {b.brandName}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
