import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Car } from "lucide-react";
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { manufacturersListQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

interface ManufacturerGridProps {
  categorySlug: string;
  categoryId: string;
  limit?: number;
}

export function ManufacturerGrid({ categorySlug, categoryId, limit }: ManufacturerGridProps) {
  const { data, isLoading, isError } = useQuery(manufacturersListQuery(categoryId));

  if (isLoading) {
    return (
      <>
        {/* Mobile Skeleton */}
        <div className="flex sm:hidden overflow-x-auto gap-3 pb-2 no-scrollbar px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center shrink-0 w-[72px] gap-1">
              <SkeletonBlock className="h-14 w-14 rounded-2xl" />
              <SkeletonBlock className="h-3 w-12" />
            </div>
          ))}
        </div>
        {/* Desktop Skeleton */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: limit ?? 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
      </>
    );
  }

  if (isError || !data || !Array.isArray(data) || data.length === 0) return null;

  const sorted = [...data]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, limit ?? data.length);
  const FallbackIcon = Car;

  return (
    <>
      {/* Mobile: Sleek Horizontal Snap Row with Compact Chips */}
      <div className="flex sm:hidden overflow-x-auto gap-3 pb-2 px-1 snap-x no-scrollbar">
        {sorted.map((m) => (
          <Link
            key={m.id}
            to="/manufacturers/$categorySlug/$slug"
            params={{ categorySlug, slug: toSlug(m.name) }}
            className="flex flex-col items-center shrink-0 w-[72px] text-center cursor-pointer group snap-start active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center p-2 group-active:scale-95 transition-transform">
              {m.logoUrl ? (
                <img
                  src={m.logoUrl}
                  alt={m.name}
                  className="h-full w-full object-contain mix-blend-multiply drop-shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="font-extrabold text-sm text-gray-700">
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-gray-800 mt-1 truncate w-full leading-tight">
              {m.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Desktop: Standard 6-Column Grid */}
      <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {sorted.map((m) => (
          <Link
            key={m.id}
            to="/manufacturers/$categorySlug/$slug"
            params={{ categorySlug, slug: toSlug(m.name) }}
            className="group"
          >
            <GradientBlobCard className="flex flex-col items-center justify-center gap-2 p-4 text-center h-full">
              <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
                {m.logoUrl ? (
                  <img src={m.logoUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                ) : (
                  <FallbackIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </span>
              <span className="text-sm font-semibold text-foreground line-clamp-2">
                {m.name}
              </span>
            </GradientBlobCard>
          </Link>
        ))}
      </div>
    </>
  );
}
