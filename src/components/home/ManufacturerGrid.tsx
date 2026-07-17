import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Car } from "lucide-react";
import { manufacturersListQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

export function ManufacturerGrid() {
  const { data, isLoading, isError } = useQuery(manufacturersListQuery());

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
      {sorted.map((m) => (
        <Link
          key={m.id}
          to="/manufacturers/$categorySlug/$makeSlug"
          params={{ categorySlug: "car-batteries", makeSlug: toSlug(m.name) }}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-product min-w-[120px] snap-start lg:min-w-0"
        >
          <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
            {m.logoUrl ? (
              <img src={m.logoUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" />
            ) : (
              <Car className="h-8 w-8 text-muted-foreground" />
            )}
          </span>
          <span className="text-sm font-medium text-foreground line-clamp-2">
            {m.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
