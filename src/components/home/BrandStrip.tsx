import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toSlug } from "@/lib/utils";
import { featuredBrandsQuery, brandsQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { Image } from "@/components/common/Image";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function BrandStrip() {
  const featured = useQuery(featuredBrandsQuery());
  const all = useQuery(brandsQuery());

  const featuredList = Array.isArray(featured.data) ? featured.data : [];
  const allList = Array.isArray(all.data) ? all.data : [];

  const hasFeatured = featuredList.length > 0;
  const isLoading = featured.isLoading || (!hasFeatured && all.isLoading);
  const data = (hasFeatured ? featuredList : allList).filter(
    (b) => b.productCount === undefined || b.productCount > 0
  );

  if (isLoading) {
    return (
      <>
        {/* Mobile Skeleton */}
        <div className="flex sm:hidden overflow-x-auto gap-2.5 pb-2 no-scrollbar px-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16 w-28 rounded-xl shrink-0" />
          ))}
        </div>
        {/* Desktop Skeleton */}
        <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }
  if (data.length === 0) return null;

  return (
    <>
      {/* Mobile: Compact Authorized Dealership Strip & Horizontal Chips */}
      <div className="sm:hidden space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 px-1">
          <span className="uppercase tracking-wide text-gray-500">Authorized Dealerships</span>
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-semibold text-[10px]">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>100% Genuine OE</span>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 px-1 snap-x no-scrollbar">
          {data.map((b) => (
            <Link
              key={b.brandId}
              to="/brand/$brandSlug"
              params={{ brandSlug: toSlug(b.brandName) }}
              className="flex items-center justify-center p-2.5 h-14 min-w-[100px] rounded-xl bg-white border border-gray-100 shadow-2xs shrink-0 snap-start active:scale-95 transition-transform"
            >
              {b.brandLogo ? (
                <img
                  src={b.brandLogo}
                  alt={b.brandName}
                  className="max-h-8 max-w-[85px] object-contain mix-blend-multiply drop-shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="font-extrabold text-xs text-gray-700 tracking-tight">
                  {b.brandName}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: Standard Grid */}
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.map((b) => (
          <Link
            key={b.brandId}
            to="/brand/$brandSlug"
            params={{ brandSlug: toSlug(b.brandName) }}
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
    </>
  );
}
