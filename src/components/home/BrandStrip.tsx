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
    <div className="relative flex w-full overflow-hidden py-2">
      {/* Edge Gradients for Premium Look */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />

      <div className="flex w-max animate-marquee gap-4 px-2 hover:[animation-play-state:paused] sm:gap-6 sm:px-3">
        {[...data, ...data].map((b, i) => (
          <Link
            key={`${b.brandId}-${i}`}
            to="/products"
            search={{ brandId: b.brandId }}
            className="group flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-product sm:h-24 sm:w-40"
          >
            {b.brandLogo ? (
              <Image
                src={b.brandLogo}
                alt={b.brandName}
                aspect="auto"
                rounded={false}
                className="h-10 w-full bg-transparent sm:h-12"
              />
            ) : (
              <span className="font-display text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
                {b.brandName}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
