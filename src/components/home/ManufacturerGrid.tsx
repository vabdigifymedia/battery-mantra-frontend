import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Car } from "lucide-react";
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { manufacturersListQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { normalizeImageUrl } from "@/lib/image/cdn";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

interface ManufacturerGridProps {
  categorySlug: string;
  categoryId: string;
  limit?: number;
}

export function ManufacturerGrid({ categorySlug, categoryId, limit = 9 }: ManufacturerGridProps) {
  const { data, isLoading, isError } = useQuery(manufacturersListQuery(categoryId));

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-2.5 sm:gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0 lg:snap-none">
        {Array.from({ length: limit }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 min-w-[120px] lg:min-w-0 snap-start rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError || !data || !Array.isArray(data) || data.length === 0) return null;

  const sorted = [...data]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, limit ?? data.length);
  const FallbackIcon = Car;

  return (
    <div className="flex overflow-x-auto gap-2.5 sm:gap-3 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0 lg:snap-none">
      {sorted.map((m) => (
        <Link
          key={m.id}
          to="/manufacturers/$categorySlug/$slug"
          params={{ categorySlug, slug: toSlug(m.name) }}
          className="snap-start"
        >
          <GradientBlobCard className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 lg:p-2.5 xl:p-3.5 text-center min-w-[120px] lg:min-w-0 h-full">
            <span className="grid h-12 w-12 sm:h-14 sm:w-14 xl:h-16 xl:w-16 place-items-center text-primary transition-transform group-hover:scale-110">
              {m.logoUrl ? (
                <img
                  src={normalizeImageUrl(m.logoUrl)}
                  alt={m.name}
                  className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <FallbackIcon className="h-7 w-7 xl:h-8 xl:w-8 text-muted-foreground" />
              )}
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-tight">
              {m.name}
            </span>
          </GradientBlobCard>
        </Link>
      ))}
    </div>
  );
}
